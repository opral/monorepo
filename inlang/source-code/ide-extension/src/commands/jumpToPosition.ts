import { commands, Position, Range, TextEditorRevealType, window } from "vscode"
import { telemetry } from "../services/telemetry/implementation.js"
import type { Message } from "@inlang/sdk"
import * as vscode from "vscode"

export const jumpToPositionCommand = {
	command: "inlang.jumpToPosition",
	title: "Inlang: Jump to position in editor",
	register: commands.registerCommand,
	callback: async function (args: {
		messageId: Message["id"]
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

		telemetry.capture({
			event: "IDE-EXTENSION jumped to position in editor",
		})
	},
}
