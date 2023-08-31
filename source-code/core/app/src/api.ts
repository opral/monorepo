import type { InlangConfig } from "@inlang/app"
import type {
	InvalidLintRuleError,
	LintRuleThrowedError,
	LintReport,
	LintRule,
	LintLevel,
} from "@inlang/lint"
import type { Message } from "@inlang/messages"
import type { Result } from "@inlang/result"
import type {
	InvalidConfigError,
	NoPluginProvidesLoadOrSaveMessagesError,
	PluginSaveMessagesError,
} from "./errors.js"
import type {
	Plugin,
	PluginReturnedInvalidAppSpecificApiError,
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginHasInvalidSchemaError,
	PluginUsesReservedNamespaceError,
	ResolvedPluginApi,
} from "@inlang/plugin"
import type { PackageImportError, PackageError } from "@inlang/package"

export type InstalledPlugin = {
	meta: Plugin["meta"]
	/**
	 * The package which the plugin is installed from.
	 */
	package: string
	// disabled: boolean
}

export type InstalledLintRule = {
	meta: LintRule["meta"]
	/**
	 * The package which the lint rule is installed from.
	 */
	package: string
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
			| PackageImportError
			| PackageError
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
	config: Subscribable<InlangConfig | undefined>
	setConfig: (config: InlangConfig) => Result<void, InvalidConfigError>
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
