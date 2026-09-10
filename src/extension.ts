import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
import { BrowserController } from './browserController';

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('Integrated Browser Auto Reload');
  const browserController = new BrowserController(outputChannel);
  const configManager = new ConfigManager(context, outputChannel);

  const saveWatcher = vscode.workspace.onDidSaveTextDocument((document) => {
    if (!configManager.isMatch(document.fileName)) {
      return;
    }
    outputChannel.appendLine(`[AutoReload] Triggering reload for: ${document.fileName}`);
    browserController.triggerReload();
  });

  const reloadCommand = vscode.commands.registerCommand(
    'integratedBrowserAutoReload.reload',
    () => {
      browserController.triggerReload();
    }
  );

  context.subscriptions.push(outputChannel, saveWatcher, reloadCommand);
}

export function deactivate(): void {}
