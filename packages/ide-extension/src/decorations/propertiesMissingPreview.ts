import { state } from "../state.js"
import * as vscode from "vscode"

export const propertiesMissingPreview = (args: { activeTextEditor: vscode.TextEditor }) => {
	const ideExtension = state().config.ideExtension

	if (!ideExtension) {
		// create decoration in inlang.config.js file stating that the ideExtension properties are missing
		const decorationType = vscode.window.createTextEditorDecorationType({
			after: {
				contentText:
					"Warning: The VS Code extension is not working because no plugin defines the ide extension properties.",
				margin: "0 0.5rem",
				color: "white",
				backgroundColor: "rgb(255, 140, 0, 0.15)",
				border: "1px solid rgb(255, 140, 0, 0.5)",
			},
		})

		const document = args.activeTextEditor.document
		const firstLine = document.lineAt(0)
		const range = new vscode.Range(firstLine.range.start, firstLine.range.end)

		// if the file is inlang.config.js -> decorate the first line with the decorationType
		if (document.fileName.endsWith("inlang.config.js")) {
			args.activeTextEditor.setDecorations(decorationType, [range])
		}
	}
}
