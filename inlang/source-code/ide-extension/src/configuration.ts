import { openInEditorCommand } from "./commands/openInEditor.js"
import { extractMessageCommand } from "./commands/extractMessage.js"
import { editMessageCommand } from "./commands/editMessage.js"
import { EventEmitter } from "vscode"
import { openProjectCommand } from "./commands/openProject.js"
import { openSettingsFileCommand } from "./commands/openSettingsFile.js"
import { type ProjectViewNode } from "./utilities/project/project.js"
import type { ErrorNode } from "./utilities/errors/errors.js"
import { copyErrorCommand } from "./commands/copyError.js"

export const CONFIGURATION = {
	EVENTS: {
		ON_DID_EDIT_MESSAGE: new EventEmitter<void>(),
		ON_DID_EXTRACT_MESSAGE: new EventEmitter<void>(),
		ON_DID_PROJECT_TREE_VIEW_CHANGE: new EventEmitter<ProjectViewNode | undefined>(),
		ON_DID_ERROR_TREE_VIEW_CHANGE: new EventEmitter<ErrorNode | undefined>(),
	},
	COMMANDS: {
		EDIT_MESSAGE: editMessageCommand,
		EXTRACT_MESSAGE: extractMessageCommand,
		OPEN_IN_EDITOR: openInEditorCommand,
		OPEN_PROJECT: openProjectCommand,
		OPEN_SETTINGS_FILE: openSettingsFileCommand,
		COPY_ERROR: copyErrorCommand,
	},
	FILES: {
		// TODO: remove this hardcoded assumption for multi project support
		//
		PROJECT: "project.inlang/settings.json",
	},
	STRINGS: {
		MISSING_TRANSLATION_MESSAGE: "[missing]",
		EDITOR_BASE_URL: "https://fink.inlang.com/",
		GETTING_STARTED_URL:
			"https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension",
		DOCS_URL: "https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension",
		APP_ID: "app.inlang.ideExtension",
	},
} as const

export const INTERPOLATE = {
	COMMAND_URI: (command: keyof typeof CONFIGURATION.COMMANDS, args: string) =>
		`command:${CONFIGURATION.COMMANDS[command].command}?${args}`,
} as const
