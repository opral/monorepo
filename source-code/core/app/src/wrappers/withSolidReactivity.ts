import type { InlangInstance } from "../api.js"

import { observable, type from as solidFrom } from "../solid.js"
import type { MessageQueryApi } from "@inlang/messages"

export const withSolidReactivity = (
	instance: InlangInstance,
	args: {
		from: typeof solidFrom
	},
): SolidInlangInstance => {
	const convert = <T>(signal: () => T): (() => T) => {
		return args.from(observable(signal)) as () => T
	}

	return {
		appSpecificApi: convert(instance.appSpecificApi),
		config: convert(instance.config),
		errors: convert(instance.errors),
		lint: {
			init: instance.lint.init,
			reports: convert(instance.lint.reports),
		},
		installed: {
			lintRules: convert(instance.installed.lintRules),
			plugins: convert(instance.installed.plugins),
		},
		setConfig: instance.setConfig,
		query: instance.query,
	} satisfies SolidInlangInstance
}

export type SolidInlangInstance = {
	appSpecificApi: () => ReturnType<InlangInstance["appSpecificApi"]>
	installed: {
		plugins: () => ReturnType<InlangInstance["installed"]["plugins"]>
		lintRules: () => ReturnType<InlangInstance["installed"]["lintRules"]>
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
