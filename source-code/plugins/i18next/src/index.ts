import type { InlangModule } from "@inlang/module"
import { plugin } from "./plugin.js"

export default {
	plugins: [plugin],
} satisfies InlangModule['default']
