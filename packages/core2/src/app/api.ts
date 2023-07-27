import type { InlangConfig } from "@inlang/config"
import type { LintException, LintReport } from "../lint/api.js"
import type { MessageQueryApi } from "../message/query.js"
import type { InlangInstanceEnvironment } from "./environment/api.js"

export type InlangInstance = {
	config: {
		get: () => InlangConfig
		set: (config: InlangConfig) => void
	}
	env: InlangInstanceEnvironment
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
