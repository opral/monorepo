import type { Result } from "@inlang/result"
import type * as RuntimeError from "./errors.js"
import type * as ModuleResolutionError from "./resolve-modules/errors.js"
import type {
	MessageLintLevel,
	MessageLintRule,
	Message,
	Plugin,
	ProjectSettings,
	MessageLintReport,
} from "./versionedInterfaces.js"
import type { ResolvedPluginApi } from "./resolve-modules/plugins/types.js"

export type InstalledPlugin = {
	id: Plugin["id"]
	displayName: Plugin["displayName"]
	description: Plugin["description"]
	/**
	 * The module which the plugin is installed from.
	 */
	module: string
	settingsSchema: Plugin["settingsSchema"]
	// disabled: boolean
}

export type InstalledMessageLintRule = {
	id: MessageLintRule["id"]
	displayName: MessageLintRule["displayName"]
	description: MessageLintRule["description"]
	/**
	 * The module which the lint rule is installed from.
	 */
	module: string
	level: MessageLintLevel
	settingsSchema: MessageLintRule["settingsSchema"]
}

export type InlangProject = {
	/**
	 * The project's id.
	 */
	// TODO #2063 make project id non-optional when every project is guaranteed to a project id
	id?: string
	installed: {
		plugins: Subscribable<InstalledPlugin[]>
		messageLintRules: Subscribable<InstalledMessageLintRule[]>
	}
	errors: Subscribable<
		((typeof ModuleResolutionError)[keyof typeof ModuleResolutionError] | Error)[]
	>
	customApi: Subscribable<ResolvedPluginApi["customApi"]>
	settings: Subscribable<ProjectSettings>
	setSettings: (config: ProjectSettings) => Result<void, RuntimeError.ProjectSettingsInvalidError>
	query: {
		messages: MessageQueryApi
		messageLintReports: MessageLintReportsQueryApi
	}
}

// const x = {} as InlangProject
// const l = await x.lint()
// x.lint.subscribe((m) => console.log(m))

export type Subscribable<Value> = {
	(): Value
	subscribe: (callback: (value: Value) => void) => void
}

export type MessageQueryApi = {
	create: (args: { data: Message }) => boolean
	get: ((args: { where: { id: Message["id"] } }) => Readonly<Message>) & {
		subscribe: (
			args: { where: { id: Message["id"] } },
			callback: (message: Message) => void
		) => void
	}
	// use getByDefaultAlias() to resolve a message from its alias, not subscribable
	getByDefaultAlias: ((alias: Message["alias"]["default"]) => Readonly<Message>) & {
		subscribe: (alias: Message["alias"]["default"], callback: (message: Message) => void) => void
	}
	includedMessageIds: Subscribable<Message["id"][]>
	/*
	 * getAll is depricated do not use it
	 */
	getAll: Subscribable<Readonly<Message[]>>
	update: (args: { where: { id: Message["id"] }; data: Partial<Message> }) => boolean
	upsert: (args: { where: { id: Message["id"] }; data: Message }) => void
	delete: (args: { where: { id: Message["id"] } }) => boolean
}

export type MessageLintReportsQueryApi = {
	getAll: () => Promise<MessageLintReport[]>
	get: (args: {
		where: { messageId: MessageLintReport["messageId"] }
	}) => Promise<Readonly<MessageLintReport[]>>
}
