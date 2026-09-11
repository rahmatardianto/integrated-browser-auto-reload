import type * as vscode from 'vscode';

export function normalizeExtension(ext: string): string {
  return ext
    .trim()
    .toLowerCase()
    .replace(/^[*.\s]+/, '');
}

export class ConfigManager {
  private extensions: Set<string> = new Set();
  private excludePatterns: string[] = [];
  private extensionRegex: RegExp | null = null;
  private readonly vscodeApi?: typeof vscode;

  constructor(
    private readonly context?: vscode.ExtensionContext,
    private readonly outputChannel?: vscode.OutputChannel,
    initialConfig?: { fileExtensions?: string[]; excludePatterns?: string[] }
  ) {
    try {
      this.vscodeApi = require('vscode');
    } catch {
      // Running in unit tests or outside VS Code host
    }

    this.loadConfig(initialConfig);

    if (this.context && this.vscodeApi?.workspace) {
      this.context.subscriptions.push(
        this.vscodeApi.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration('integratedBrowserAutoReload')) {
            this.loadConfig();
            this.outputChannel?.appendLine(
              `[ConfigManager] Configuration reloaded. Active extensions: ${Array.from(this.extensions).join(', ')}`
            );
          }
        })
      );
    }
  }

  public normalizeExtension(ext: string): string {
    return normalizeExtension(ext);
  }

  public loadConfig(customConfig?: { fileExtensions?: string[]; excludePatterns?: string[] }): void {
    let rawExtensions: string[] = [];
    let rawExcludes: string[] = [];

    if (customConfig) {
      rawExtensions = customConfig.fileExtensions ?? [];
      rawExcludes = customConfig.excludePatterns ?? [];
    } else if (this.vscodeApi?.workspace) {
      const config = this.vscodeApi.workspace.getConfiguration('integratedBrowserAutoReload');
      rawExtensions = config.get<string[]>('fileExtensions', []);
      rawExcludes = config.get<string[]>('excludePatterns', []);
    }

    this.extensions.clear();
    for (const ext of rawExtensions) {
      const normalized = normalizeExtension(ext);
      if (normalized) {
        this.extensions.add(normalized);
      }
    }

    this.excludePatterns = rawExcludes
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter(Boolean);

    if (this.extensions.size > 0) {
      const escaped = Array.from(this.extensions)
        .sort((a, b) => b.length - a.length)
        .map((ext) => ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      this.extensionRegex = new RegExp(`\\.(${escaped.join('|')})$`, 'i');
    } else {
      this.extensionRegex = null;
    }
  }

  public isMatch(filePath: string): boolean {
    if (!filePath || !this.extensionRegex) {
      return false;
    }

    let normalizedPath = filePath.replace(/\\/g, '/');
    if (this.vscodeApi?.workspace?.asRelativePath) {
      normalizedPath = this.vscodeApi.workspace.asRelativePath(filePath, false).replace(/\\/g, '/');
    }

    // 1. Exclude pattern check (higher priority)
    for (const pattern of this.excludePatterns) {
      if (this.matchesExcludePattern(normalizedPath, pattern)) {
        return false;
      }
    }

    // 2. Extension check
    const fileName = normalizedPath.split('/').pop() || '';
    return this.extensionRegex.test(fileName);
  }

  private matchesExcludePattern(normalizedPath: string, pattern: string): boolean {
    const p = pattern.replace(/\\/g, '/').trim();
    if (!p) {
      return false;
    }

    const pathWithSlash = normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath;

    if (p.includes('*') || p.includes('?')) {
      const regexStr = p
        .replace(/[.+^${}()|[\]]/g, '\\$&')
        .replace(/\*\*/g, '.*')
        .replace(/(?<!\.)\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      return new RegExp(regexStr, 'i').test(pathWithSlash);
    }

    const clean = p.replace(/^\/+|\/+$/g, '');
    const escaped = clean.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|/)${escaped}(/|$)`, 'i').test(normalizedPath);
  }

  public getExtensions(): Set<string> {
    return new Set(this.extensions);
  }

  public getExcludePatterns(): string[] {
    return [...this.excludePatterns];
  }
}
