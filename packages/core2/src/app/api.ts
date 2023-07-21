import type { InlangConfig } from "../config/schema.js"
import type { LintException, LintReport } from "../lint/api.js"
import type { MessagesQueryApi_1 } from "../messages/query.js"
import type { InlangInstanceEnv } from "./env/types.js"

export type InlangInstance = {
	config: Readonly<InlangConfig>
	env: InlangInstanceEnv
	// TODO: exception handling
	exceptions: InlangInstanceException[]
	messages: {
		query: MessagesQueryApi_1
	}
	lint: {
		// for now, only simply array that can be improved in the future
		// see https://github.com/inlang/inlang/issues/1098
		reports: LintReport[]
		exceptions: LintException[]
	}
}

class InlangInstanceException extends Error {
	constructor(message: string) {
		super(message)
		this.name = "InlangInstanceException"
	}
}
