import type { LintReport } from "@inlang/lint"
import type { InlangProject } from "./api.js"
import { expectType } from "tsd"

const inlang: InlangProject = {} as any

expectType<LintReport[]>(inlang.lint.reports())

inlang.lint.reports.subscribe((value) => {
	expectType<LintReport[]>(value)
})

inlang.lint.reports()
inlang.lint.reports.subscribe(() => undefined)

inlang.installed.lintRules()[0]?.lintLevel
inlang.installed.lintRules()[0]?.package
inlang.installed.lintRules()[0]?.meta
