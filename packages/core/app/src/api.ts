import type { InlangConfig } from "@inlang/config"
import type { LintRuleError, LintError, LintReport, LintRule } from "@inlang/lint"
import type { MessageQueryApi } from "@inlang/messages"
import type { Result } from "@inlang/result"
import type { InvalidConfigError } from "./errors.js"
import type {
	Plugin,
	PluginAppSpecificApiReturnError,
	PluginFunctionDetectLanguageTagsAlreadyDefinedError,
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
	PluginUsesInvalidIdError,
	PluginUsesInvalidSchemaError,
	PluginUsesReservedNamespaceError,
	ResolvedPlugins,
} from "@inlang/plugin"
import type { ModuleImportError, ModuleError } from "@inlang/module"

// TODO: remove all getters and use solid store for whole object, just expose `setConfig`
export type InlangInstance = {
	meta: {
		modules: () => string[]
		plugins: () => (Plugin["meta"] & { module: string })[]
		lintRules: () => (LintRule["meta"] & { module: string })[]
	}
	errors: {
		module: () => (ModuleImportError | ModuleError)[]
		plugin: () => (
			| PluginAppSpecificApiReturnError
			| PluginFunctionDetectLanguageTagsAlreadyDefinedError
			| PluginFunctionLoadMessagesAlreadyDefinedError
			| PluginFunctionSaveMessagesAlreadyDefinedError
			| PluginUsesInvalidIdError
			| PluginUsesInvalidSchemaError
			| PluginUsesReservedNamespaceError
			| Error
		)[]
		lintRules: () => (LintRuleError | LintError)[]
	}
	appSpecificApi: () => ResolvedPlugins["appSpecificApi"]
	config: () => InlangConfig
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
		reports: () => LintReport[]
	}
}
