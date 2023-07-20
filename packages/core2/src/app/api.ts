import type { InlangConfig } from "../config/schema.js"
import type { LintException, LintReport } from "../lint/api.js"
import type { MessagesQueryApi_1 } from "../messages/query.js"
import type { InlangAppEnvironment } from "./env/types.js"

export type InlangApp = {
	config: Readonly<InlangConfig>
	env: InlangAppEnvironment
	// TODO: exception handling
	exceptions: InlangAppException[]
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

class InlangAppException extends Error {
	constructor(message: string) {
		super(message)
		this.name = "InlangAppException"
	}
}
