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

	const convertObservablesToSignals = (obj: any): any => {
		if (typeof obj !== "object" || obj === null) {
			// Base case: if obj is not an object or is null, return as is
			return obj
		}

		if (Array.isArray(obj)) {
			// If obj is an array, process each element
			return obj.map((item) => convertObservablesToSignals(item))
		}

		// If obj is an object, process its properties
		const result: Record<string, unknown> = {}
		for (const key in obj) {
			if (obj[key]) {
				if (obj[key].subscribe) {
					result[key] = from(obj[key])
				} else if (typeof obj[key] === "object") {
					result[key] = convertObservablesToSignals(obj[key])
				} else {
					result[key] = obj[key]
				}
			}
		}
		return result
	}

	return convertObservablesToSignals(instance) as SolidInlangInstance
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
