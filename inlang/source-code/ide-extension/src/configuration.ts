import { openInEditorCommand } from "./commands/openInEditor.js"
import { extractMessageCommand } from "./commands/extractMessage.js"
import { editMessageCommand } from "./commands/editMessage.js"
import { EventEmitter } from "vscode"

export const CONFIGURATION = {
	EVENTS: {
		ON_DID_EDIT_MESSAGE: new EventEmitter<void>(),
		ON_DID_EXTRACT_MESSAGE: new EventEmitter<void>(),
	},
	COMMANDS: {
		EDIT_MESSAGE: editMessageCommand,
		EXTRACT_MESSAGE: extractMessageCommand,
		OPEN_IN_EDITOR: openInEditorCommand,
	},
	FILES: {
		// TODO: remove this hardcoded assumption for multi project support
		//
		PROJECT: "project.inlang/settings.json",
	},
} as const

export const INTERPOLATE = {
	COMMAND_URI: (command: keyof typeof CONFIGURATION.COMMANDS, args: string) =>
		`command:${CONFIGURATION.COMMANDS[command].command}?${args}`,
} as const
