import { exit } from "process";
import * as vscode from "vscode";
import { applyWrappingPattern, inlangConfig, readConfig } from "./helpers";
import { postTranslateRequest } from "./translate";

const inlangCmd = "vscode-extension.send";
const inlangCmdName = "Send to inlang";
/* *select text-> ask for namespace 
	-> get default translation lang
	-> write to db (create new translation with default lang)
	-> replace selected text with namespace  */

/**called once : // This line of code will only be executed once when your extension is activated  */
function onCreate() {
  new vscode.CodeAction(inlangCmdName).command = {
    command: inlangCmd,
    title: inlangCmdName,
  };
}

/**will be executed every time your command is executed*/
async function onCommand(cfg: inlangConfig) {
  if (cfg === undefined) {
    let currDir = vscode.workspace.workspaceFolders?.[0].uri.path;
    let cfg: inlangConfig = readConfig(currDir + "/inlang.config.json");
    if (cfg.projectId === "") {
      vscode.window.showErrorMessage("inlang.config.json missing projectId");
      throw new Error("inlang.config.json missing projectId");
    } else if (cfg.vsCodeExtension.wrappingPattern === "") {
      vscode.window.showErrorMessage(
        "inlang.config.json missing wrapping pattern"
      );
      throw new Error("inlang.config.json missing wrapping pattern");
    } else {
      let msg =
        currDir != null
          ? "loaded config from:" + JSON.stringify(currDir)
          : "please open a directory";

      vscode.window.showInformationMessage(msg);
    }
  }

  const activeTextEditor = vscode.window.activeTextEditor;
  let range = activeTextEditor.selection;
  let selectionText = "";

  if (range != null) {
    selectionText = activeTextEditor?.document.getText(range) ?? "";
    const keyName = await vscode.window.showInputBox({
      prompt: "your inlang key name",
    });

    if (keyName === undefined || keyName === "") {
      vscode.window.showInformationMessage("Key name not set.");
    } else {
      const response = await postTranslateRequest({
        projectId: cfg.projectId,
        baseTranslation: {
          key_name: keyName,
          text: selectionText,
        },
      });
      if (response.ok) {
        vscode.window.showInformationMessage(keyName + " added to dashboard.");
        activeTextEditor.edit((builder) =>
          builder.replace(range, applyWrappingPattern(cfg, keyName))
        );
      } else {
        vscode.window.showErrorMessage(keyName + " could not be added");
      }
    }
  }
}

// this method is called when your extension is activated, your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
  // https://github.com/microsoft/vscode-extension-samples
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("javascript", new InlangCA(), {
      providedCodeActionKinds: InlangCA.providedCodeActionKinds,
    })
  );

  onCreate();
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  let cfg: inlangConfig;
  let disposable = vscode.commands.registerCommand(inlangCmd, () => {
    onCommand(cfg);
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

export class InlangCA implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    let ca1 = (new vscode.CodeAction(inlangCmdName).command = {
      command: inlangCmd,
      title: inlangCmdName,
    });
    return [ca1];
  }
  resolveCodeAction?(
    codeAction: vscode.CodeAction,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeAction> {
    throw new Error("Method not implemented.");
  }
}
// "@supabase/supabase-js": "^1.23.0",
