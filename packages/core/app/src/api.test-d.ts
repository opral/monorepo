import type { LintReport } from "@inlang/lint"
import type { InlangInstance } from "./api.js"
import { expectType } from "tsd"

const inlang: InlangInstance = {} as any

expectType<LintReport[]>(inlang.lint.reports())

inlang.lint.reports.subscribe((value) => {
	expectType<LintReport[]>(value)
})

inlang.lint.reports()
inlang.lint.reports.subscribe(() => undefined)

inlang.installed.lintRules()[0]?.lintLevel
inlang.installed.lintRules()[0]?.module
inlang.installed.lintRules()[0]?.meta
