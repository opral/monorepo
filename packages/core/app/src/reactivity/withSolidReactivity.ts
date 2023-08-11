import type { ModuleError, ModuleImportError, ResolveModulesFunction } from "@inlang/module"
import type { InlangInstance } from "../api.js"
import type {
	InlangConfig,
	MessageQueryApi,
	PluginAppSpecificApiReturnError,
	PluginFunctionDetectLanguageTagsAlreadyDefinedError,
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
	PluginUsesInvalidIdError,
	PluginUsesInvalidSchemaError,
	PluginUsesReservedNamespaceError,
	ResolvedPlugins,
	Result,
} from "@inlang/plugin"
import type { LintError, LintReport, LintRuleError } from "@inlang/lint"
import type { InvalidConfigError } from "../errors.js"

export const withSolidReactivity = async (instancePromise: Promise<InlangInstance>, from: any) => {
	const instance = await instancePromise

	if (instance) {
		instance.config = from(instance.config)
		instance.meta.plugins = from(instance.meta.plugins)
		instance.meta.lintRules = from(instance.meta.lintRules)
		instance.errors.module = from(instance.errors.module)
		instance.errors.plugin = from(instance.errors.plugin)
		instance.errors.lintRules = from(instance.errors.lintRules)
		instance.appSpecificApi = from(instance.appSpecificApi)
		instance.lint.reports = from(instance.lint.reports)
	}

	return instance as any as SolidInlangInstance // TODO: fix type
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

export type SolidInlangInstance = {
	meta: {
		plugins: () => Awaited<ReturnType<ResolveModulesFunction>>["data"]["meta"]["plugins"]
		lintRules: () => Awaited<ReturnType<ResolveModulesFunction>>["data"]["meta"]["lintRules"]
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
