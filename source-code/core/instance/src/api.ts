import type { InlangConfig } from "@inlang/config"
import type { InlangEnvironment } from "@inlang/environment"
import type { LintException, LintReport } from "@inlang/lint-api"
import type { MessageQueryApi } from "@inlang/messages"
import type { Result } from "@inlang/result"
import type { InvalidConfigError } from "./errors.js"

export type InlangInstance = {
	config: {
		get: () => InlangConfig
		/**
		 * Set the config for the instance.
		 */
		set: (config: InlangConfig) => Result<void, InvalidConfigError>
	}
	env: InlangEnvironment
	query: {
		messages: MessageQueryApi
	}
	lint: {
		// for now, only simply array that can be improved in the future
		// see https://github.com/inlang/inlang/issues/1098
		reports: () => LintReport[]
		exceptions: () => LintException[]
	}
}
