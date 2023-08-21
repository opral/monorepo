import { emptyPatternRule } from "./rules/emptyPattern/emptyPattern.js"
import { identicalPatternRule } from "./rules/identicalPattern/identicalPattern.js"
import { messageWithoutSourceRule } from "./rules/messageWithoutSource/messageWithoutSource.js"
import { missingMessageRule } from "./rules/missingMessage/missingMessage.js"

export default {
	lintRules: [emptyPatternRule, identicalPatternRule, messageWithoutSourceRule, missingMessageRule],
}
