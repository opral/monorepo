import type { InlangProject } from "./api.js"
import { expectType } from "tsd"
import type { LintReport } from "./interfaces.js"

const inlang: InlangProject = {} as any

expectType<LintReport[] | undefined>(inlang.query.lintReports.getAll())

inlang.query.lintReports.getAll.subscribe((value) => {
	expectType<LintReport[] | undefined>(value)
})

inlang.query.lintReports.getAll()
inlang.query.lintReports.getAll.subscribe(() => undefined)

inlang.installed.lintRules()[0]?.lintLevel
inlang.installed.lintRules()[0]?.module
inlang.installed.lintRules()[0]?.meta
