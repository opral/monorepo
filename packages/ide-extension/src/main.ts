import * as vscode from "vscode";
import { ExtractPattern } from "./actions/extractPattern.js";
import { initState } from "./state.js";
import { extractPatternCommand } from "./commands/extractPattern.js";
import { showPattern } from "./decorations/showPattern.js";

export async function activate(
	context: vscode.ExtensionContext
): Promise<void> {
	try {
		vscode.window.showInformationMessage("HELLO FROM EXTENSION");

		// start the extension
		main({ context });
		// in case the active window changes -> restart the extension
		// (could be improved in the future for performance reasons
		// by detecting whether the closest config differs. For now,
		// it's easier to restart the application each time.)
		vscode.window.onDidChangeActiveTextEditor(() => {
			// in case of running subscriptions -> dispose them (no commands will be shown anymore in the IDE)
			for (const subscription of context.subscriptions) {
				subscription.dispose();
			}
			// restart extension
			main({ context });
		});
	} catch (error) {
		vscode.window.showErrorMessage((error as Error).message);
		console.error(error);
	}
}

/**
 * The main entry of the extension.
 *
 * This function registers all commands, actions, loads the config etc.
 */
async function main(args: { context: vscode.ExtensionContext }): Promise<void> {
	// if no active text editor -> no window is open -> hence dont activate the extension
	const activeTextEditor = vscode.window.activeTextEditor;
	if (activeTextEditor === undefined) {
		return;
	}
	// checking whether a config file exists -> if not dont start the extension
	const potentialConfigFilePaths = await vscode.workspace.findFiles(
		"**/inlang.config.js"
	);
	if (potentialConfigFilePaths.length === 0) {
		return;
	}
	// activeTextEditor is defined -> try to get the config
	// const config = await ({ activeTextEditor, configFileUris });
	// if (config.isErr) {
	// vscode.window.showErrorMessage(config.error.message);
	// return;
	// }

	// config loaded sucessfully -> intialize state
	// initState({
	// 	config: config.value.config,
	// 	configPath: config.value.path,
	// 	resources: resources.value,
	// });

	const supportedLanguages = [
		"javascript",
		"typescript",
		"javascriptreact",
		"typescriptreact",
		"svelte",
	];
	// register the commands
	args.context.subscriptions.push(
		vscode.commands.registerCommand(
			extractPatternCommand.id,
			extractPatternCommand.callback
		)
	);
	// register the code actions
	for (const language of supportedLanguages) {
		args.context.subscriptions.push(
			vscode.languages.registerCodeActionsProvider(
				language,
				new ExtractPattern(),
				{
					providedCodeActionKinds: ExtractPattern.providedCodeActionKinds,
				}
			)
		);
	}
	// register decorations
	showPattern({ activeTextEditor });
	// register translation file watcher
	// const fileWatcher = vscode.workspace
	//   .createFileSystemWatcher(
	//     translationFilesGlobPattern({
	//       cwd: path.dirname(config.value.path),
	//       pathPattern: config.value.config.pathPattern,
	//     })
	//   )
	//   .onDidChange(() => restart({ context: args.context }));
}

// this method is called when your extension is deactivated
// export function deactivate() {}
