// import { createImport } from "./import.j
import { endpoint } from "comlink-node/worker"
import { populateLevel } from "./populateLintLevel.js"
import { resolveModules } from "../resolveModules2.js"
import * as Comlink from "comlink"
import type { Message, MessageBundle } from "../types/message-bundle.js"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import type { LintConfig, LintFix, LintReport } from "../types/lint.js"
import { createDebugImport, importSequence } from "../import-utils.js"
import { createImport } from "./import.js"
import lintRule from "../dev-modules/lint-rule.js"
import makeOpralUppercase from "../dev-modules/opral-uppercase-lint-rule.js"
import _debug from "debug"
import { combineToBundles } from "../createMessageBundleSlotAdapter.js"
import createSlotReader from "../../persistence/slotfiles/createSlotReader.js"
import missingSelectorLintRule from "../dev-modules/missing-selector-lint-rule.js"
const debug = _debug("sdk-v2:lint-report-worker")

const lintConfigs: LintConfig[] = [
	{
		id: "1234",
		ruleId: "messageBundleLintRule.inlang.emptyPattern",
		messageId: undefined,
		bundleId: undefined,
		variantId: undefined,
		level: "error",
	},
]

export async function createLinter(
	projectPath: string,
	settings: ProjectSettings2,
	fs: Pick<NodeishFilesystemSubset, "readFile" | "readdir" | "mkdir">
) {
	debug("creating linter")
	const _import = importSequence(
		createDebugImport({
			"sdk-dev:lint-rule.js": lintRule,
			"sdk-dev:opral-uppercase-lint.js": makeOpralUppercase,
			"sdk-dev:missing-selector-lint-rule.js": missingSelectorLintRule,
		}),
		createImport(projectPath, fs)
	)

	const resolvedModules = await resolveModules({
		settings,
		_import,
	})

	const customApi = resolvedModules.resolvedPluginApi.customApi
	console.info("lint-worker resolvedModules", resolvedModules)
	console.info("lint-worker customApi", customApi)

	async function getMessageBundles() {
		// get the affected message-bundle
		const messageBundlesPath = projectPath + "/messagebundles/"
		const messagesPath = projectPath + "/messages/"

		const bundleStorage = await createSlotReader<MessageBundle>({
			fs,
			path: messageBundlesPath,
			watch: false,
		})

		const messageStorage = await createSlotReader<Message>({
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
		lint: async (settings: ProjectSettings2): Promise<LintReport[]> => {
			const messageBundles = await getMessageBundles()

			const reports: LintReport[] = []
			const promises: Promise<any>[] = []

			for (const messageBundle of messageBundles.values()) {
				for (const lintRule of resolvedModules.messageBundleLintRules) {
					const promise = lintRule.run({
						messageBundle: messageBundle,
						settings,
						report: (report) => {
							const reportWithRule = { ...report, ruleId: lintRule.id }
							const fullReport = populateLevel(reportWithRule, lintConfigs)
							reports.push(fullReport)
						},
					})
					promises.push(promise as Promise<any>)
				}
			}

			await Promise.all(promises)
			console.info("lint reports", reports)
			return reports
		},

		fix: async (report: LintReport, fix: LintFix) => {
			//enforce that the fix exists on the lint-report
			const usedFix = report.fixes.find((f) => f.title === fix.title)
			if (!usedFix) throw new Error(`fix ${fix.title} not available on report "${report.body}"`)

			const messageBundles = await getMessageBundles()
			const bundle = [...messageBundles.values()].find(
				(bundle) => bundle.id === report.messageBundleId
			)

			if (!bundle) throw new Error(`messageBundle ${report.messageBundleId} not found`)
			const rule = resolvedModules.messageBundleLintRules.find((rule) => rule.id === report.ruleId)
			if (!rule) throw new Error(`rule ${report.ruleId} not found`)
			if (!rule.fix) throw new Error(`rule ${report.ruleId} does not have a fix function`)

			const fixed = await rule.fix({ report, fix, settings, messageBundle: bundle })
			return fixed
		},
	})
}

Comlink.expose(createLinter, endpoint)
