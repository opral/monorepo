import type { LintReport } from "@inlang/lint"
import type { InlangProject } from "./api.js"
import { expectType } from "tsd"

const inlang: InlangProject = {} as any

expectType<LintReport[]>(inlang.query.lintReports.getAll())

inlang.query.lintReports.getAll()

inlang.installed.lintRules()[0]?.lintLevel
inlang.installed.lintRules()[0]?.package
inlang.installed.lintRules()[0]?.meta
