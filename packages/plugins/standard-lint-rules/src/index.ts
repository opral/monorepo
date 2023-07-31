// TODO: remove ignore comment
// @ts-ignore
import type { InlangModule } from "@inlang/module"
import { identicalPatternRule } from "./rules/identicalPattern/identicalPattern.js"
import { messageWithoutSourceRule } from "./rules/messageWithoutSource/messageWithoutSource.js"
import { missingMessageRule } from "./rules/missingMessage/missingMessage.js"

export default {
	lintRules: [identicalPatternRule, messageWithoutSourceRule, missingMessageRule],
} satisfies InlangModule
