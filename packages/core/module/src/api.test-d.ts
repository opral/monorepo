import type { Plugin } from "@inlang/plugin"
import type { LintRule } from "@inlang/lint"
import type { InlangModule } from "./api.js"

const plugin1 = {} as Plugin

const plugin2 = {} as Plugin

const lintRule1 = {} as LintRule

const lintRule2 = {} as LintRule

const module = {
	default: {
		plugins: [plugin1, plugin2],
		lintRules: [lintRule1, lintRule2],
	},
} satisfies InlangModule
