import * as vscode from 'vscode'
import { applyWrappingPattern, readAndValidateConfig } from './helpers'
import { postTranslateRequest } from './translate'
import { InlangConfig } from './types/inlangConfig'

const inlangCmd = 'vscode-extension.send'
const inlangCmdName = 'Inlang: Create key'
/* *select text-> ask for namespace 
	-> get default translation lang
	-> write to db (create new translation with default lang)
	-> replace selected text with namespace  */

/**called once : // This line of code will only be executed once when your extension is activated  */
function onCreate() {
    new vscode.CodeAction(inlangCmdName).command = {
        command: inlangCmd,
        title: inlangCmdName,
    }
}

/**will be executed every time your command is executed*/
async function onCommand(config: InlangConfig) {
    if (config === undefined) {
        const currDir = vscode.workspace.workspaceFolders?.[0].uri.path
        const configValidated = readAndValidateConfig(
            currDir + '/inlang.config.json'
        )
        if (configValidated.error) {
            vscode.window.showErrorMessage(configValidated.error)
            throw configValidated.error
        } else if (configValidated.data === null) {
            vscode.window.showErrorMessage('The config data was null.')
            throw configValidated.error
        }
        let message =
            currDir != null
                ? 'loaded config from:' + JSON.stringify(currDir)
                : 'please open a directory'

        vscode.window.showInformationMessage(message)
        config = configValidated.data
    }

    const activeTextEditor = vscode.window.activeTextEditor
    const range = activeTextEditor?.selection
    let selectionText = ''

    if (range != null) {
        selectionText = activeTextEditor?.document.getText(range) ?? ''
        const keyName = await vscode.window.showInputBox({
            prompt: 'your inlang key name',
        })

        if (keyName === undefined || keyName === '') {
            vscode.window.showInformationMessage('Key name not set.')
        } else {
            const response = await postTranslateRequest({
                projectId: config.projectId,
                baseTranslation: {
                    key_name: keyName,
                    text: selectionText,
                },
            })
            if (response.ok && range) {
                vscode.window.showInformationMessage(
                    keyName + ' added to dashboard.'
                )
                activeTextEditor?.edit((builder) =>
                    builder.replace(
                        range,
                        applyWrappingPattern(config, keyName)
                    )
                )
            } else {
                vscode.window.showErrorMessage(keyName + ' could not be added')
            }
        }
    }
}

// this method is called when your extension is activated, your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
    // https://github.com/microsoft/vscode-extension-samples
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            'javascript',
            new InlangCA(),
            {
                providedCodeActionKinds: InlangCA.providedCodeActionKinds,
            }
        )
    )

    onCreate()
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json

    let config: InlangConfig
    let disposable = vscode.commands.registerCommand(inlangCmd, () => {
        onCommand(config)
    })

    context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export function deactivate() {}

export class InlangCA implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
    ]

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        let ca1 = (new vscode.CodeAction(inlangCmdName).command = {
            command: inlangCmd,
            title: inlangCmdName,
        })
        return [ca1]
    }
    resolveCodeAction?(
        codeAction: vscode.CodeAction,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeAction> {
        throw new Error('Method not implemented.')
    }
}
// "@supabase/supabase-js": "^1.23.0",
