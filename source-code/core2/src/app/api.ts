import type { InlangConfig } from "@inlang/config"
import type { LintException, LintReport } from "../lint/api.js"
import type { MessageQueryApi } from "../messages/query.js"
import type { InlangInstanceEnv } from "./env/types.js"

export type InlangInstance = {
	config: {
		get: () => InlangConfig
		set: (config: InlangConfig) => void
	}
	env: InlangInstanceEnv
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
