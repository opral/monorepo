import type { Result } from "@inlang/result"
import type * as RuntimeError from "./errors.js"
import type * as ModuleResolutionError from "./resolve-modules/errors.js"
import type {
	MessageLintLevel,
	MessageLintRule,
	Message,
	Plugin,
	ProjectConfig,
	MessageLintReport,
} from "./interfaces.js"
import type { ResolvedPluginApi } from "./resolve-modules/plugins/types.js"

export type InstalledPlugin = {
	meta: Plugin["meta"]
	/**
	 * The module which the plugin is installed from.
	 */
	module: string
	// disabled: boolean
}

export type InstalledMessageLintRule = {
	meta: MessageLintRule["meta"]
	/**
	 * The module which the lint rule is installed from.
	 */
	module: string
	lintLevel: MessageLintLevel
}

export type InlangProject = {
	installed: {
		plugins: Subscribable<InstalledPlugin[]>
		messageLintRules: Subscribable<InstalledMessageLintRule[]>
	}
	errors: Subscribable<
		((typeof ModuleResolutionError)[keyof typeof ModuleResolutionError] | Error)[]
	>
	customApi: Subscribable<ResolvedPluginApi["customApi"]>
	config: Subscribable<ProjectConfig | undefined>
	setConfig: (config: ProjectConfig) => Result<void, RuntimeError.InvalidConfigError>
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
			callback: (message: Message) => void,
		) => void
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
	getAll: Subscribable<MessageLintReport[]>
	get: ((args: {
		where: { messageId: MessageLintReport["messageId"] }
	}) => Readonly<MessageLintReport[]>) & {
		subscribe: (
			args: { where: { messageId: MessageLintReport["messageId"] } },
			callback: (MessageLintRules: Readonly<MessageLintReport[]>) => void,
		) => void
	}
}
