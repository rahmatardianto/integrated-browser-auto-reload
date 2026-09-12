import type * as vscode from 'vscode';

const FOCUS_GROUP_COMMANDS = [
  'workbench.action.focusFirstEditorGroup',
  'workbench.action.focusSecondEditorGroup',
  'workbench.action.focusThirdEditorGroup',
  'workbench.action.focusFourthEditorGroup',
  'workbench.action.focusFifthEditorGroup',
  'workbench.action.focusSixthEditorGroup',
  'workbench.action.focusSeventhEditorGroup',
  'workbench.action.focusEighthEditorGroup',
];

export class BrowserController {
  private reloadTimer?: NodeJS.Timeout;
  private readonly vscodeApi?: typeof vscode;

  constructor(
    private readonly outputChannel?: vscode.OutputChannel,
    vscodeApi?: typeof vscode
  ) {
    if (vscodeApi) {
      this.vscodeApi = vscodeApi;
    } else {
      try {
        this.vscodeApi = require('vscode');
      } catch {
        // Running in unit tests or outside VS Code host
      }
    }
  }

  public triggerReload(_document?: vscode.TextDocument): void {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }
    this.reloadTimer = setTimeout(() => {
      this.doReload();
    }, 50);
  }

  public async doReload(): Promise<void> {
    this.outputChannel?.appendLine('[BrowserController] Triggering reload...');

    if (!this.vscodeApi) {
      return;
    }

    const originalGroupViewColumn = this.vscodeApi.window.tabGroups?.activeTabGroup?.viewColumn;

    // 1. Reload webview-based previews (Simple Browser, Live Preview, etc.)
    try {
      await this.vscodeApi.commands.executeCommand('workbench.action.webview.reloadWebviewAction');
    } catch (error) {
      this.outputChannel?.appendLine(`[BrowserController] Webview reload failed: ${error}`);
    }

    // 2. Reload VS Code Integrated Browser (BrowserView)
    try {
      await this.reloadIntegratedBrowser(originalGroupViewColumn);
    } catch (error) {
      this.outputChannel?.appendLine(`[BrowserController] Integrated browser reload failed: ${error}`);
    }
  }

  private async reloadIntegratedBrowser(originalGroupViewColumn?: number): Promise<void> {
    if (!this.vscodeApi) {
      return;
    }

    const tabGroups = this.vscodeApi.window.tabGroups;
    let targetGroup: vscode.TabGroup | undefined;

    if (tabGroups) {
      for (const group of tabGroups.all) {
        if (originalGroupViewColumn !== undefined && group.viewColumn === originalGroupViewColumn) {
          continue;
        }
        const activeTab = group.activeTab;
        if (
          activeTab &&
          !(activeTab.input instanceof this.vscodeApi.TabInputText) &&
          !(activeTab.input instanceof this.vscodeApi.TabInputTextDiff)
        ) {
          targetGroup = group;
          break;
        }
      }
    }

    if (
      targetGroup &&
      targetGroup.viewColumn >= 1 &&
      targetGroup.viewColumn <= FOCUS_GROUP_COMMANDS.length
    ) {
      await this.vscodeApi.commands.executeCommand(FOCUS_GROUP_COMMANDS[targetGroup.viewColumn - 1]);
      await this.vscodeApi.commands.executeCommand('workbench.action.browser.reload');
      if (
        originalGroupViewColumn &&
        originalGroupViewColumn >= 1 &&
        originalGroupViewColumn <= FOCUS_GROUP_COMMANDS.length
      ) {
        await this.vscodeApi.commands.executeCommand(
          FOCUS_GROUP_COMMANDS[originalGroupViewColumn - 1]
        );
      }
    } else {
      await this.vscodeApi.commands.executeCommand('workbench.action.browser.reload');
    }
  }
}

