import { state } from "../state.js"
import * as vscode from "vscode"

export const propertiesMissingPreview = () => {
	const ideExtension = state().project.customApi()["app.inlang.ideExtension"]

	const activeTextEditor = vscode.window.activeTextEditor
	if (!activeTextEditor) {
		return
	}

	if (!ideExtension) {
		// create decoration in project.inlang.json file stating that the ideExtension properties are missing
		const decorationType = vscode.window.createTextEditorDecorationType({
			after: {
				contentText:
					"Warning: The VS Code extension is not working because no module defines the ide extension `customApi['app.inlang.ideExtension']`.",
				margin: "0 0.5rem",
				color: "white",
				backgroundColor: "rgb(255, 140, 0, 0.15)",
				border: "1px solid rgb(255, 140, 0, 0.5)",
			},
		})

		const document = activeTextEditor.document

		const firstLine = document.lineAt(0)
		const range = new vscode.Range(firstLine.range.start, firstLine.range.end)

		// if the file is project.inlang.json -> decorate the first line with the decorationType
		if (document.fileName.endsWith("project.inlang.json")) {
			activeTextEditor.setDecorations(decorationType, [range])
		}
	}
}
