import type { ValueError } from "@sinclair/typebox/errors"
import type { MessageBundleLintRule } from "./lint.js"

export class MessageBundleLintRuleIsInvalidError extends Error {
	constructor(options: { id: MessageBundleLintRule["id"]; errors: ValueError[] }) {
		super(
			`The message bundle lint rule "${options.id}" is invalid:\n\n${options.errors.join("\n")}`
		)
		this.name = "MessageBundleLintRuleIsInvalidError"
	}
}
