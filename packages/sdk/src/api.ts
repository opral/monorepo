import type { Result } from "@inlang/result"
import type * as RuntimeError from "./errors.js"
import type * as ModuleResolutionError from "./resolve-modules/errors.js"
import type {
	LintLevel,
	LintReport,
	LintRule,
	Message,
	Plugin,
	ProjectConfig,
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

export type InstalledLintRule = {
	meta: LintRule["meta"]
	/**
	 * The module which the lint rule is installed from.
	 */
	module: string
	lintLevel: LintLevel
}

export type InlangProject = {
	installed: {
		plugins: Subscribable<InstalledPlugin[]>
		lintRules: Subscribable<InstalledLintRule[]>
	}
	errors: Subscribable<
		((typeof ModuleResolutionError)[keyof typeof ModuleResolutionError] | Error)[]
	>
	customApi: Subscribable<ResolvedPluginApi["customApi"]>
	config: Subscribable<ProjectConfig | undefined>
	setConfig: (config: ProjectConfig) => Result<void, RuntimeError.InvalidConfigError>
	query: {
		messages: MessageQueryApi
		lintReports: LintReportsQueryApi
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
	get: ((args: { where: { id: Message["id"] } }) => Readonly<Message> | undefined) & {
		subscribe: (
			args: { where: { id: Message["id"] } },
			callback: (message: Message | undefined) => void,
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

export type LintReportsQueryApi = {
	getAll: Subscribable<LintReport[] | undefined>
	get: ((args: {
		where: { messageId: LintReport["messageId"] }
	}) => Readonly<LintReport[]> | undefined) & {
		subscribe: (
			args: { where: { messageId: LintReport["messageId"] } },
			callback: (lintReports: Readonly<LintReport[]> | undefined) => void,
		) => void
	}
}
