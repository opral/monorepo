import { openInFinkCommand } from "./commands/openInFink.js"
import { extractMessageCommand } from "./commands/extractMessage.js"
import { createMessageCommand } from "./commands/createMessage.js"
import { editMessageCommand } from "./commands/editMessage.js"
import { EventEmitter } from "vscode"
import { openProjectCommand } from "./commands/openProject.js"
import { openSettingsFileCommand } from "./commands/openSettingsFile.js"
import { type ProjectViewNode } from "./utilities/project/project.js"
import type { ErrorNode } from "./utilities/errors/errors.js"
import { copyErrorCommand } from "./commands/copyError.js"
import { previewLocaleCommand } from "./commands/previewLocaleCommand.js"
import { jumpToPositionCommand } from "./commands/jumpToPosition.js"
import { machineTranslateMessageCommand } from "./commands/machineTranslate.js"
import { openSettingsViewCommand } from "./commands/openSettingsView.js"
import { toggleInlineAnnotationsCommand } from "./commands/toggleInlineAnnotation.js"
import { openEditorViewCommand } from "./commands/openEditorView.js"
import { reloadProjectCommand } from "./commands/reloadProject.js"

export const CONFIGURATION = {
	EVENTS: {
		ON_DID_CREATE_MESSAGE: new EventEmitter<void>(),
		ON_DID_EDIT_MESSAGE: new EventEmitter<void>(),
		ON_DID_EXTRACT_MESSAGE: new EventEmitter<void>(),
		ON_DID_PROJECT_TREE_VIEW_CHANGE: new EventEmitter<ProjectViewNode | undefined>(),
		ON_DID_ERROR_TREE_VIEW_CHANGE: new EventEmitter<ErrorNode | undefined>(),
		ON_DID_PREVIEW_LOCALE_CHANGE: new EventEmitter<string>(),
		ON_DID_SETTINGS_VIEW_CHANGE: new EventEmitter<void>(),
		ON_DID_EDITOR_VIEW_CHANGE: new EventEmitter<void>(),
		ON_DID_RECOMMENDATION_VIEW_CHANGE: new EventEmitter<void>(),
	},
	COMMANDS: {
		CREATE_MESSAGE: createMessageCommand,
		EDIT_MESSAGE: editMessageCommand,
		EXTRACT_MESSAGE: extractMessageCommand,
		SET_PREVIEW_LOCALE: previewLocaleCommand,
		JUMP_TO_POSITION: jumpToPositionCommand,
		OPEN_IN_FINK: openInFinkCommand,
		OPEN_PROJECT: openProjectCommand,
		OPEN_SETTINGS_FILE: openSettingsFileCommand,
		OPEN_SETTINGS_VIEW: openSettingsViewCommand,
		OPEN_EDITOR_VIEW: openEditorViewCommand,
		COPY_ERROR: copyErrorCommand,
		MACHINE_TRANSLATE_MESSAGE: machineTranslateMessageCommand,
		TOGGLE_INLINE_ANNOTATIONS: toggleInlineAnnotationsCommand,
		RELOAD_PROJECT: reloadProjectCommand,
	},
	FILES: {
		// TODO: remove this hardcoded assumption for multi project support
		//
		PROJECT: "project.inlang/settings.json",
	},
	STRINGS: {
		MISSING_TRANSLATION_MESSAGE: "[missing]",
		FINK_BASE_URL: "https://fink.inlang.com/",
		GETTING_STARTED_URL: "https://inlang.com/m/r7kp499g/app-inlang-ideExtension",
		DOCS_URL: "https://inlang.com/m/r7kp499g/app-inlang-ideExtension",
		APP_ID: "app.inlang.ideExtension",
	},
} as const

export const INTERPOLATE = {
	COMMAND_URI: (command: keyof typeof CONFIGURATION.COMMANDS, args: string) =>
		`command:${CONFIGURATION.COMMANDS[command].command}?${args}`,
} as const
