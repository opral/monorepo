import type { InlangConfig } from "@inlang/config"
import type { LintRuleError, LintError, LintReport, LintRule } from "@inlang/lint"
import type { MessageQueryApi } from "@inlang/messages"
import type { Result } from "@inlang/result"
import type { InvalidConfigError } from "./errors.js"
import type { Plugin, ResolvedPlugins } from "@inlang/plugin"

// TODO: remove all getters and use solid store for whole object, just expose `setConfig`
export type InlangInstance = {
	meta: {
		modules: string[]
		plugins: (Plugin['meta'] & { module: string })[]
		lintRules: (LintRule['meta'] & { module: string })[]
	}
	errors: {
		module: Error[] // TODO: define Error type more precisely
		plugin: Error[] // TODO: define Error type more precisely
		lintRules: (LintRuleError | LintError)[]
	}
	appSpecificApi: ResolvedPlugins['appSpecificApi']
	config: {
		get: () => InlangConfig
		/**
		 * Set the config for the instance.
		 */
		set: (config: InlangConfig) => Result<void, InvalidConfigError>
	}
	messages: {
		query: MessageQueryApi
	}
	lint: {
		/**
		 * Initialize lint.
		 */
		init: () => Promise<void>
		// for now, only simply array that can be improved in the future
		// see https://github.com/inlang/inlang/issues/1098
		reports: {
			get: () => LintReport[]
		}
	}
}
