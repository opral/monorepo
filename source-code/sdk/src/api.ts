import type { InvalidLintRuleError, LintRuleThrowedError } from "@inlang/lint"
import type { Result } from "@inlang/result"
import type {
	InvalidConfigError,
	NoPluginProvidesLoadOrSaveMessagesError,
	PluginSaveMessagesError,
} from "./errors.js"
import type {
	PluginReturnedInvalidAppSpecificApiError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginUsesReservedNamespaceError,
	ResolvedPluginApi,
} from "@inlang/resolve-plugins"
import type { ModuleImportError, ModuleError } from "@inlang/module"
import type {
	LintLevel,
	LintReport,
	LintRule,
	Message,
	Plugin,
	ProjectConfig,
} from "./interfaces.js"

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
	disabled: boolean
}

export type InlangProject = {
	installed: {
		plugins: Subscribable<InstalledPlugin[]>
		lintRules: Subscribable<InstalledLintRule[]>
	}
	errors: Subscribable<
		(
			| ModuleImportError
			| ModuleError
			| PluginReturnedInvalidAppSpecificApiError
			| PluginLoadMessagesFunctionAlreadyDefinedError
			| PluginSaveMessagesFunctionAlreadyDefinedError
			| PluginHasInvalidIdError
			| PluginHasInvalidSchemaError
			| PluginUsesReservedNamespaceError
			| InvalidLintRuleError
			| LintRuleThrowedError
			| PluginSaveMessagesError
			| NoPluginProvidesLoadOrSaveMessagesError
			| Error
		)[]
	>
	appSpecificApi: Subscribable<ResolvedPluginApi["appSpecificApi"]>
	config: Subscribable<ProjectConfig | undefined>
	setConfig: (config: ProjectConfig) => Result<void, InvalidConfigError>
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
	get: ((args: { where: { id: Message["id"] } }) => Message | undefined) & {
		subscribe: (
			args: { where: { id: Message["id"] } },
			callback: (message: Message | undefined) => void,
		) => void
	}
	includedMessageIds: Subscribable<string[]>
	/*
	 * getAll is depricated do not use it
	 */
	getAll: Subscribable<Message[]>
	update: (args: { where: { id: Message["id"] }; data: Partial<Message> }) => boolean
	upsert: (args: { where: { id: Message["id"] }; data: Message }) => void
	delete: (args: { where: { id: Message["id"] } }) => boolean
}

export type LintReportsQueryApi = {
	getAll: Subscribable<LintReport[] | undefined>
	get: ((args: { where: { messageId: LintReport["messageId"] } }) => LintReport[] | undefined) & {
		subscribe: (
			args: { where: { messageId: LintReport["messageId"] } },
			callback: (lintReports: LintReport[] | undefined) => void,
		) => void
	}
}
