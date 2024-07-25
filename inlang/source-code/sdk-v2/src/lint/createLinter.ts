// TODO SDK-v2 LINT implement linting
// import { populateLevel } from "./populateLintLevel.js"
// import * as Comlink from "comlink"
// import type { ProjectSettings2 } from "../types/project-settings.js"
// import type { Fix, LintReport, LintResult, MessageBundleLintRule } from "../types/lint.js"
// import { debug, hashLintReports } from "./worker.js"
// import type { InlangProject } from "../types/project.js"

// function hash(url: string) {
// 	const bytes = new TextEncoder().encode(url)

// 	// 64-bit FNV1a hash
// 	// https://en.wikipedia.org/wiki/FNV-1a
// 	const hash = bytes.reduce(
// 		(hash, byte) => BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1_099_511_628_211n),
// 		14_695_981_039_346_656_037n
// 	)

// 	return hash.toString(36)
// }

// export function hashLintReports(reports: LintReport[]) {
// 	const stringified = JSON.stringify(reports)
// 	return hash(stringified)
// }

// export async function createLinter(
// 	inlangProject: InlangProject
// ) {

// 	return {
// 		lint: async (settings: ProjectSettings2): Promise<LintResult> => {
// 			const messageBundles = await inlangProject.getBundles()
// 			const reportsById: {
// 				[bundleId: string]: LintReport[]
// 			} = {}

// 			const promises: Promise<any>[] = []

// 			for (const messageBundle of messageBundles.values()) {
// 				reportsById[messageBundle.id] = []

// 				for (const lintRule of inlangProject.installed.lintRules.getValue()) {
//                     // TODO SDK-v2 LINT get message lint rules separatly
//                     const messageBundleLintRule = lintRule as unknown as MessageBundleLintRule
// 					const promise = messageBundleLintRule.run({
// 						messageBundle: messageBundle,
// 						settings,
// 						report: (report) => {
// 							const reportWithRule = { ...report, ruleId: lintRule.id }

// 							const fullReport = populateLevel(reportWithRule, settings.lintConfig)

// 							const reportsForBundle = reportsById[messageBundle.id] || []
// 							reportsForBundle.push(fullReport)
// 						},
// 					})
// 					promises.push(promise as Promise<any>)
// 				}
// 			}

// 			// wait for lints to finish
// 			await Promise.all(promises)

// 			// populate hashesh
// 			const result: LintResult = {}
// 			for (const [bundleId, reports] of Object.entries(reportsById)) {
// 				const hash = hashLintReports(reports)
// 				result[bundleId] = {
// 					hash,
// 					reports,
// 				}
// 			}

// 			console.log(result)
// 			return result
// 		},

// 		fix: async <Report extends LintReport>(report: Report, fix: Fix<Report>) => {
// 			//enforce that the fix exists on the lint-report
// 			const usedFix = report.fixes.find((f) => f.title === fix.title)
// 			if (!usedFix) throw new Error(`fix ${fix.title} not available on report "${report.body}"`)

//             const bundle = await inlangProject.bundles.getNestedById(report.messageBundleId)

// 			if (!bundle) throw new Error(`messageBundle ${report.messageBundleId} not found`)

//             // TODO SDK-v2 LINT get message lint rules separatly
// 			const rule = inlangProject.installed.lintRules.getValue().find((rule) => rule.id === report.ruleId) as unknown as MessageBundleLintRule
// 			if (!rule) throw new Error(`rule ${report.ruleId} not found`)
// 			if (!rule.fix) throw new Error(`rule ${report.ruleId} does not have a fix function`)

// 			const messageBundle = structuredClone(bundle)
// 			const fixed = await rule.fix({ report, fix, settings: inlangProject.settings.getValue(), messageBundle })
// 			return fixed
// 		},
// 	}
// }
