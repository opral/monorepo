// TODO: remove ignore comment
// @ts-ignore
import type { InlangModule } from "@inlang/module"
import { missingMessageRule } from "./missingMessage.js"

export default {
	lintRules: [missingMessageRule],
} satisfies InlangModule
