import type { ModuleError, ModuleImportError, ResolveModulesFunction } from "@inlang/module"
import type { InlangInstance } from "../api.js"

import { observable, type from as solidFrom } from "../solid.js"
import type { MessageQueryApi } from "@inlang/messages"

export const withSolidReactivity = (
	instance: InlangInstance,
	args: {
		from: typeof solidFrom
	},
): SolidInlangInstance => {
	const convert = <T>(signal: () => T) => {
		return args.from(observable(signal))
	}

	return {
		appSpecificApi: convert(instance.appSpecificApi),
		config: convert(instance.config),
		errors: convert(instance.errors),
		lint: {
			init: instance.lint.init,
			reports: convert(instance.lint.reports),
		},
		meta: {
			lintRules: convert(instance.meta.lintRules),
			plugins: convert(instance.meta.plugins),
		},
		setConfig: instance.setConfig,
	} as any
}

export type SolidInlangInstance = {
	appSpecificApi: () => ReturnType<InlangInstance["appSpecificApi"]>
	meta: {
		plugins: () => Awaited<ReturnType<ResolveModulesFunction>>["data"]["meta"]["plugins"]
		lintRules: () => Awaited<ReturnType<ResolveModulesFunction>>["data"]["meta"]["lintRules"]
	}
	errors: () => ReturnType<InlangInstance["errors"]>
	config: () => ReturnType<InlangInstance["config"]>
	setConfig: InlangInstance["setConfig"]
	query: {
		messages: MessageQueryApi
	}
	lint: {
		/**
		 * Initialize lint.
		 */
		init: () => ReturnType<InlangInstance["lint"]["init"]>
		// for now, only simply array that can be improved in the future
		// see https://github.com/inlang/inlang/issues/1098
		reports: () => ReturnType<InlangInstance["lint"]["reports"]>
	}
}
