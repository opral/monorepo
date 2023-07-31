// TODO: remove ignore comment
// @ts-ignore
import type { InlangModule } from "@inlang/module"
import { identicalPatternRule } from "./identicalPattern.js"

export default {
	lintRules: [identicalPatternRule],
} satisfies InlangModule
