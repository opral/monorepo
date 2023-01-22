import * as vscode from "vscode";
import { state } from "../state.js";

export type ExtractMessageCommandArgs = {
	pattern: string;
	activeTextEditor: vscode.TextEditor;
};

export const extractMessageCommand = {
	id: "inlang.extractMessage",
	title: "Extract Message",
	callback: async function (args: ExtractMessageCommandArgs) {
		if (
			state().config.ideExtension.extractMessageReplacementOptions === undefined
		) {
			return vscode.window.showWarningMessage(
				"The `extractMessageReplacementOptions` are not defined in the inlang.config.json but required to extract a message."
			);
		} else if (state().config.referenceLanguage === undefined) {
			return vscode.window.showWarningMessage(
				"The `referenceLanguage` is not defined in the inlang.config.js but required to extract a message."
			);
		}
		const id = await vscode.window.showInputBox({
			title: "Enter the ID:",
		});
		if (id === undefined) {
			return;
		}
		const chosenReplacementOption = await vscode.window.showQuickPick(
			[...state()
				.config.ideExtension.extractMessageReplacementOptions({ id }), "How to edit these replacement options?"],
			{ title: "Replace highlighted text with:" }
		);
		if (chosenReplacementOption === undefined) {
			return;
		} else if (
			chosenReplacementOption === "How to edit these replacement options?"
		) {
			// TODO #152
			await vscode.env.openExternal(
				vscode.Uri.parse("https://github.com/inlang/inlang")
			);
		}
		// 	let create: Result<void, Error>;
		// 	if (id.includes(".")) {
		// 		create = state.resources.createAttribute({
		// 			messageId: id.split(".")[0],
		// 			id: id.split(".")[1],
		// 			pattern: args.pattern,
		// 			languageCode: "en",
		// 		});
		// 	} else {
		// 		create = state.resources.createMessage({
		// 			id,
		// 			pattern: args.pattern,
		// 			languageCode: state.config.baseLanguageCode as LanguageCode,
		// 		});
		// 	}
		// 	if (create.isErr) {
		// 		return vscode.window.showErrorMessage(create.error.message);
		// 	}
		// 	const write = writeTranslationFiles({
		// 		cwd: state.configPath,
		// 		resources: state.resources,
		// 		...state.config,
		// 	});
		// 	if (write.isErr) {
		// 		return vscode.window.showErrorMessage(write.error.message);
		// 	}
		// 	// replacing the pattern once all possible errors are ruled out.
		// 	await args.activeTextEditor.edit((editor) => {
		// 		editor.replace(args.activeTextEditor.selection, replacementPattern);
		// 	});
		// 	return vscode.window.showInformationMessage("Pattern extracted.");
		// },
	},
} as const;
