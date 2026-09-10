import * as vscode from 'vscode';

export class BrowserController {
  constructor(private readonly outputChannel?: vscode.OutputChannel) {}

  public async triggerReload(): Promise<void> {
    this.outputChannel?.appendLine('[BrowserController] Triggering reload...');
    try {
      await vscode.commands.executeCommand('workbench.action.webview.reloadWebviewAction');
    } catch {
      try {
        await vscode.commands.executeCommand('simpleBrowser.api.reload');
      } catch (error) {
        this.outputChannel?.appendLine(`[BrowserController] Reload failed: ${error}`);
      }
    }
  }
}
