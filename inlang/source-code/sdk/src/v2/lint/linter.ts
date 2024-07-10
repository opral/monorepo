import { populateLevel } from "./populateLintLevel.js"
import * as Comlink from "comlink"
import type { MessageBundle, Message, Variant } from "../types/message-bundle.js"
import type { ProjectSettings2 } from "../types/project-settings.js"
import {
	MessageBundleLintRule,
	type Fix,
	type LintConfig,
	type LintReport,
	type LintResult,
	type MessageBundleLintData,
} from "../types/lint.js"
import { createDebugImport, importSequence } from "../import/utils.js"
import { createCDNImportWithReadOnlyCache, createDiskImport } from "../import/index.js"

import lintRule from "../dev-modules/lint-rule.js"
import makeOpralUppercase from "../dev-modules/opral-uppercase-lint-rule.js"
import missingSelectorLintRule from "../dev-modules/missing-selector-lint-rule.js"
import missingCatchallLintRule from "../dev-modules/missingCatchall.js"
import { loadProject } from "../loadProject2.js"
import { connectToRepo } from "../rpc/repo/index.js"
import type { Subscribable } from "rxjs"

export async function createLinter(projectPath: string, repoEp: Comlink.Endpoint) {
	const repo = connectToRepo(repoEp)

	const _import = importSequence(
		createDebugImport({
			"sdk-dev:lint-rule.js": lintRule,
			"sdk-dev:opral-uppercase-lint.js": makeOpralUppercase,
			"sdk-dev:missing-selector-lint-rule.js": missingSelectorLintRule,
			"sdk-dev:missing-catchall-variant": missingCatchallLintRule,
		}),
		createDiskImport({ readFile: repo.nodeishFs.readFile }),
		createCDNImportWithReadOnlyCache(projectPath, repo.nodeishFs)
	)

	const project = await loadProject({
		repo,
		projectPath,
		_import,
		_lintFactory: async () => ({
			lint: async () => ({}),
			fix: async () => ({} as MessageBundle),
			terminate: () => {},
		}),
	})

	const resolvedModules = {
		messageBundleLintRules: await next(project.installed.lintRules),
	} as any
	console.info("resolvedModules", resolvedModules)

	async function getMessageBundles() {
		const bundles = (await project.messageBundleCollection.find().exec()).map((bundle) =>
			bundle.toMutableJSON()
		)
		return bundles
	}

	return Comlink.proxy({
		lint: async (settings: ProjectSettings2): Promise<LintResult> => {
			const messageBundles = await getMessageBundles()
			const reportsById: {
				[bundleId: string]: LintReport[]
			} = {}

			const promises: Promise<any>[] = []

			for (const messageBundle of messageBundles.values()) {
				reportsById[messageBundle.id] = []

				for (const lintRule of resolvedModules.messageBundleLintRules) {
					const promise = lintRule.run({
						node: messageBundle,
						settings,
						report: (reportData: any) => {
							const report = toReport({
								reportData,
								messageBundle,
								lintRule,
								lintConfig: settings.lintConfig,
							})
							const reportsForBundle = reportsById[messageBundle.id] || []
							reportsForBundle.push(report)
						},
					})
					promises.push(promise as Promise<any>)
				}
			}

			// wait for lints to finish
			await Promise.all(promises)

			// populate hashesh
			const result: LintResult = {}
			for (const [bundleId, reports] of Object.entries(reportsById)) {
				const hash = hashLintReports(reports)
				result[bundleId] = {
					hash,
					reports,
				}
			}

			return result
		},

		fix: async <Report extends LintReport>(report: Report, fix: Fix<Report>) => {
			const settings = await next(project.settings)

			//enforce that the fix exists on the lint-report
			const usedFix = report.fixes.find((f) => f.title === fix.title)
			if (!usedFix) throw new Error(`fix ${fix.title} not available on report "${report.body}"`)

			// find the message-bundle this lint-report belongs to
			const messageBundles = await getMessageBundles()
			const bundle = [...messageBundles.values()].find(
				(bundle) => bundle.id === report.target.messageBundleId
			)
			if (!bundle) throw new Error(`MessageBundle ${report.target.messageBundleId} not found`)

			const rule = resolvedModules.messageBundleLintRules.find(
				(rule: any) => rule.id === report.ruleId
			)
			if (!rule) throw new Error(`rule ${report.ruleId} not found`)
			if (!rule.fix) throw new Error(`rule ${report.ruleId} does not have a fix function`)

			const messageBundle = structuredClone(bundle)
			const fixed = await rule.fix({ report, fix, settings, node: messageBundle })
			return fixed
		},
	})
}

function toReport({
	reportData,
	messageBundle,
	lintConfig,
	lintRule,
}: {
	reportData: MessageBundleLintData
	messageBundle: MessageBundle
	lintRule: MessageBundleLintRule
	lintConfig: LintConfig[]
}): LintReport {
	const messageId: string | undefined = isMessage(reportData.target)
		? reportData.target.id
		: isVariant(reportData.target)
		? messageBundle.messages.find((msg) =>
				msg.variants.find((variant) => variant.id === reportData.target.id)
		  )?.id
		: undefined

	const variantId = isVariant(reportData.target) ? reportData.target.id : undefined

	const report: Omit<LintReport, "level"> = {
		ruleId: lintRule.id,
		target: {
			messageBundleId: messageBundle.id,
			messageId,
			variantId,
		},
		body: reportData.body,
		fixes: reportData.fixes || [],
	}

	return populateLevel(report, lintConfig)
}

function isVariant(data: MessageBundleLintData["target"]): data is Variant {
	return "pattern" in data
}

function isMessage(data: MessageBundleLintData["target"]): data is Message {
	return "variants" in data
}

function hashLintReports(reports: LintReport[]) {
	const stringified = JSON.stringify(reports)
	return hash(stringified)
}

function hash(url: string) {
	const bytes = new TextEncoder().encode(url)

	// 64-bit FNV1a hash
	// https://en.wikipedia.org/wiki/FNV-1a
	const hash = bytes.reduce(
		(hash, byte) => BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1_099_511_628_211n),
		14_695_981_039_346_656_037n
	)

	return hash.toString(36)
}

async function next<T>(obs: Subscribable<T>): Promise<T> {
	return new Promise((resolve) => {
		obs.subscribe({
			next(value) {
				resolve(value)
			},
		})
	})
}

export function makeLinterAvailableTo(ep: Comlink.Endpoint) {
	Comlink.expose(createLinter, ep)
}
