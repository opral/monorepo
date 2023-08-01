import type { InlangModule } from "@inlang/module"
import { identicalPatternRule } from "./rules/identicalPattern/identicalPattern.js"
import { messageWithoutSourceRule } from "./rules/messageWithoutSource/messageWithoutSource.js"
import { missingMessageRule } from "./rules/missingMessage/missingMessage.js"

export default {
	plugins: [],
	lintRules: [identicalPatternRule, messageWithoutSourceRule, missingMessageRule],
} satisfies InlangModule['default']
