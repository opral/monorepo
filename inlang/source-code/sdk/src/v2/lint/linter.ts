import { populateLevel } from "./populateLintLevel.js"
import { resolveModules } from "../resolveModules2.js"
import * as Comlink from "comlink"
import type {
	MessageBundle,
	MessageBundleRecord,
	MessageRecord,
	Message,
	Variant,
} from "../types/message-bundle.js"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import type {
	Fix,
	LintConfig,
	LintReport,
	LintResult,
	MessageBundleLintData,
	MessageBundleLintRule,
} from "../types/lint.js"
import { createDebugImport, importSequence } from "../import-utils.js"
import { createImport, type ImportFunction } from "./import.js"
import lintRule from "../dev-modules/lint-rule.js"
import makeOpralUppercase from "../dev-modules/opral-uppercase-lint-rule.js"
import _debug from "debug"
import { combineToBundles } from "../createMessageBundleSlotAdapter.js"
import createSlotReader from "../../persistence/slotfiles/createSlotReader.js"
import missingSelectorLintRule from "../dev-modules/missing-selector-lint-rule.js"
import missingCatchallLintRule from "../dev-modules/missingCatchall.js"
const debug = _debug("sdk-v2:lint-report-worker")

export async function createLinter(
	projectPath: string,
	settings: ProjectSettings2,
	fs: Pick<NodeishFilesystemSubset, "readFile" | "readdir" | "mkdir">,
	_import: ImportFunction | undefined = undefined
) {
	debug("creating linter")
	_import ??= importSequence(
		createDebugImport({
			"sdk-dev:lint-rule.js": lintRule,
			"sdk-dev:opral-uppercase-lint.js": makeOpralUppercase,
			"sdk-dev:missing-selector-lint-rule.js": missingSelectorLintRule,
			"sdk-dev:missing-catchall-variant": missingCatchallLintRule,
		}),
		createImport(projectPath, fs)
	)

	const resolvedModules = await resolveModules({
		settings,
		_import,
	})

	async function getMessageBundles() {
		// get the affected message-bundle
		const messageBundlesPath = projectPath + "/messagebundles/"
		const messagesPath = projectPath + "/messages/"

		const bundleStorage = await createSlotReader<MessageBundleRecord>({
			fs,
			path: messageBundlesPath,
			watch: false,
		})

		const messageStorage = await createSlotReader<MessageRecord>({
			fs,
			path: messagesPath,
			watch: false,
		})

		const bundles = await bundleStorage.readAll()
		const messages = await messageStorage.readAll()
		const messageBundles = combineToBundles(bundles, messages)
		return messageBundles
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
						report: (reportData) => {
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
			//enforce that the fix exists on the lint-report
			const usedFix = report.fixes.find((f) => f.title === fix.title)
			if (!usedFix) throw new Error(`fix ${fix.title} not available on report "${report.body}"`)

			// find the message-bundle this lint-report belongs to
			const messageBundles = await getMessageBundles()
			const bundle = [...messageBundles.values()].find(
				(bundle) => bundle.id === report.target.messageBundleId
			)
			if (!bundle) throw new Error(`MessageBundle ${report.target.messageBundleId} not found`)

			const rule = resolvedModules.messageBundleLintRules.find((rule) => rule.id === report.ruleId)
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

export function makeLinterAvailableTo(ep: Comlink.Endpoint) {
	Comlink.expose(createLinter, ep)
}
