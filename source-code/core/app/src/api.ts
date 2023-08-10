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
import type { ModuleImportError, ModuleError, ResolveModulesFunction } from "@inlang/module"

// TODO: remove all getters and use solid store for whole object, just expose `setConfig`
export type InlangInstance = {
	meta: {
		plugins: Observable<Awaited<ReturnType<ResolveModulesFunction>>["data"]["meta"]["plugins"]>
		lintRules: Observable<Awaited<ReturnType<ResolveModulesFunction>>["data"]["meta"]["lintRules"]>
	}
	errors: {
		module: Observable<(ModuleImportError | ModuleError)[]>
		plugin: Observable<
			(
				| PluginAppSpecificApiReturnError
				| PluginFunctionDetectLanguageTagsAlreadyDefinedError
				| PluginFunctionLoadMessagesAlreadyDefinedError
				| PluginFunctionSaveMessagesAlreadyDefinedError
				| PluginUsesInvalidIdError
				| PluginUsesInvalidSchemaError
				| PluginUsesReservedNamespaceError
				| Error
			)[]
		>
		lintRules: Observable<(LintRuleError | LintError)[]>
	}
	appSpecificApi: Observable<ResolvedPlugins["appSpecificApi"]>
	config: Observable<InlangConfig>
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
		reports: Observable<LintReport[]>
	}
}

interface Observable<T> {
	subscribe(observer: ObservableObserver<T>): {
		unsubscribe(): void
	}
	[Symbol.observable](): Observable<T>
}

export type ObservableObserver<T> =
	| ((v: T) => void)
	| {
			next?: (v: T) => void
			error?: (v: any) => void
			complete?: (v: boolean) => void
	  }
