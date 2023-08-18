import type { InlangProject } from "../api.js"

import { observable, type from as solidFrom } from "../solid.js"
import type { MessageQueryApi } from "@inlang/messages"

export const withSolidReactivity = (
	project: InlangProject,
	args: {
		from: typeof solidFrom
	},
): SolidInlangProject => {
	const convert = <T>(signal: () => T): (() => T) => {
		return args.from(observable(signal)) as () => T
	}

	return {
		appSpecificApi: convert(project.appSpecificApi),
		config: convert(project.config),
		errors: convert(project.errors),
		lint: {
			init: project.lint.init,
			reports: convert(project.lint.reports),
		},
		installed: {
			lintRules: convert(project.installed.lintRules),
			plugins: convert(project.installed.plugins),
		},
		setConfig: project.setConfig,
		query: project.query,
	} satisfies SolidInlangProject
}

export type SolidInlangProject = {
	appSpecificApi: () => ReturnType<InlangProject["appSpecificApi"]>
	installed: {
		plugins: () => ReturnType<InlangProject["installed"]["plugins"]>
		lintRules: () => ReturnType<InlangProject["installed"]["lintRules"]>
	}
	errors: () => ReturnType<InlangProject["errors"]>
	config: () => ReturnType<InlangProject["config"]>
	setConfig: InlangProject["setConfig"]
	query: {
		messages: MessageQueryApi
	}
	lint: {
		/**
		 * Initialize lint.
		 */
		init: () => ReturnType<InlangProject["lint"]["init"]>
		// for now, only simply array that can be improved in the future
		// see https://github.com/inlang/inlang/issues/1098
		reports: () => ReturnType<InlangProject["lint"]["reports"]>
	}
}
