import * as vscode from 'vscode';
import { Range } from 'vscode';
import { applyWrappingPattern, inlangConfig, readConfig } from './helpers';
import { postTranslateRequest, str2translateRequest } from './translate';


const inlangCmd = 'inlangext.helloWorld';
const inlangCmdName = "Send to inlang"
/* *select text-> ask for namespace 
	-> get default translation lang
	-> write to db (create new translation with default lang)
	-> replace selected text with namespace  */

/**called once : // This line of code will only be executed once when your extension is activated  */
function onCreate() {
	new vscode.CodeAction(inlangCmdName).command =
		{ command: inlangCmd, title: inlangCmdName }


	let currDir = vscode.workspace.workspaceFolders?.[0].uri.path
	let cfg: inlangConfig = readConfig(currDir + '/inlang.json')
	let msg = (currDir != null) ?
		"loaded config from curr dir:" + JSON.stringify(cfg) :
		"please open a directory"

	vscode.window.showInformationMessage(msg)
	return cfg
}
/**will be executed every time your command is executed*/
async function onCommand(cfg: inlangConfig) {

	const edt = vscode.window.activeTextEditor;
	let r = edt?.selection
	let selectionText = ''

	if (r != null) {
		const range1 = new Range(r.start, r?.end);

		selectionText = edt?.document.getText(r) ?? ''
		const trans = await str2translateRequest(selectionText);
		vscode.window.showInformationMessage(selectionText + ' -> ' + trans);
		let keyP = vscode.window.showInputBox({ prompt: "your inlang key name" })
		keyP.then(async keyStr => {
			if (keyStr != null) keyStr
			let resp = postTranslateRequest({
				"projectId": cfg.projectId,
				"baseTranslation": {
					"key_name": keyStr!,
					"text": selectionText
				}
			})
			resp.then(x =>
				console.log(x.status))

			vscode.window.showInformationMessage("created key for :" + keyStr + "and saved to inlang server!");
			edt?.edit(eb => {
				if (keyStr != null) eb.replace(range1, applyWrappingPattern(cfg, keyStr))
			})
		})
	}
}


// this method is called when your extension is activated, your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
	// https://github.com/microsoft/vscode-extension-samples
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('javascript', new InlangCA(), {
			providedCodeActionKinds: InlangCA.providedCodeActionKinds
		}));

	let cfg = onCreate()
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	let disposable = vscode.commands.registerCommand(inlangCmd, () => {
		onCommand(cfg)
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }


export class InlangCA implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		let ca1 = new vscode.CodeAction(inlangCmdName).command =
			{ command: inlangCmd, title: inlangCmdName }
		return [ca1]
	}
	resolveCodeAction?(codeAction: vscode.CodeAction, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeAction> {
		throw new Error('Method not implemented.');
	}
}
		// "@supabase/supabase-js": "^1.23.0",