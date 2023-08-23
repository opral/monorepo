import type { InlangConfig } from "@inlang/config"
import type {
	InvalidLintRuleError,
	LintRuleThrowedError,
	LintReport,
	LintRule,
	LintLevel,
} from "@inlang/lint"
import type { MessageQueryApi } from "@inlang/messages"
import type { Result } from "@inlang/result"
import type {
	InvalidConfigError,
	NoMessagesPluginError,
	PluginSaveMessagesError,
} from "./errors.js"
import type {
	Plugin,
	PluginAppSpecificApiReturnError,
	PluginFunctionDetectLanguageTagsAlreadyDefinedError,
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
	PluginUsesInvalidIdError,
	PluginUsesInvalidSchemaError,
	PluginUsesReservedNamespaceError,
	RuntimePluginApi,
} from "@inlang/plugin"
import type { ModuleImportError, ModuleError } from "@inlang/module"

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

// TODO: remove all getters and use solid store for whole object, just expose `setConfig`
export type InlangProject = {
	installed: {
		plugins: Subscribable<InstalledPlugin[]>
		lintRules: Subscribable<InstalledLintRule[]>
	}
	errors: Subscribable<
		(
			| ModuleImportError
			| ModuleError
			| PluginAppSpecificApiReturnError
			| PluginFunctionDetectLanguageTagsAlreadyDefinedError
			| PluginFunctionLoadMessagesAlreadyDefinedError
			| PluginFunctionSaveMessagesAlreadyDefinedError
			| PluginUsesInvalidIdError
			| PluginUsesInvalidSchemaError
			| PluginUsesReservedNamespaceError
			| InvalidLintRuleError
			| InvalidLintRuleError
			| LintRuleThrowedError
			| PluginSaveMessagesError
			| NoMessagesPluginError
			| Error
		)[]
	>
	appSpecificApi: Subscribable<RuntimePluginApi["appSpecificApi"]>
	config: Subscribable<InlangConfig>
	setConfig: (config: InlangConfig) => Result<void, InvalidConfigError>
	query: {
		messages: MessageQueryApi
	}
	lint: {
		/**
		 * Initialize lint.
		 */
		init: () => Promise<void>
		// for now, only simply array that can be improved in the future
		// see https://github.com/inlang/inlang/issues/1098
		reports: Subscribable<LintReport[]>
	}
}

export type Subscribable<Value> = {
	(): Value
	subscribe: (callback: (value: Value) => void) => void
}
