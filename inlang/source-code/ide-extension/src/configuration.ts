import { openInEditorCommand } from "./commands/openInEditor.js"
import { extractMessageCommand } from "./commands/extractMessage.js"
import { editMessageCommand } from "./commands/editMessage.js"

export const CONFIGURATION = {
	COMMANDS: {
		EDIT_MESSAGE: editMessageCommand,
		EXTRACT_MESSAGE: extractMessageCommand,
		OPEN_IN_EDITOR: openInEditorCommand,
	},
	FILES: {
		PROJECT: "project.inlang.json",
	},
} as const

export const INTERPOLATE = {
	COMMAND_URI: (command: keyof typeof CONFIGURATION.COMMANDS, args: string) =>
		`command:${CONFIGURATION.COMMANDS[command].command}?${args}`,
} as const
