import { commands, Position, Range, TextEditorRevealType, window } from "vscode"
import * as vscode from "vscode"
import type { Bundle } from "@inlang/sdk2"
import { capture } from "../services/telemetry/index.js"

export const jumpToPositionCommand = {
	command: "sherlock.jumpToPosition",
	title: "Sherlock: Jump to position in editor",
	register: commands.registerCommand,
	callback: async function (args: {
		bundleId: Bundle["id"]
		position: {
			start: {
				line: number
				character: number
			}
			end: {
				line: number
				character: number
			}
		}
	}) {
		const editor = window.activeTextEditor

		if (!editor) {
			return
		}

		const { start, end } = args.position
		const startPosition = new Position(start.line, start.character)
		const endPosition = new Position(end.line, end.character)
		const range = new Range(startPosition, endPosition)
		editor.selection = new vscode.Selection(range.start, range.end)
		editor.revealRange(range, TextEditorRevealType.InCenterIfOutsideViewport)

		capture({
			event: "IDE-EXTENSION jumped to position in editor",
		})
	},
}
