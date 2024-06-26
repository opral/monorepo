import { createImport } from "./import.js"
import { endpoint } from "comlink-node/worker"
import { populateLevel } from "./populateLintLevel.js"
import type { LintConfig, LintReport } from "../types/lint.js"
import createSlotStorage from "../../persistence/slotfiles/createSlotStorage.js"
import * as Comlink from "comlink"
import { resolveModules } from "../resolveModules2.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import type { Message, MessageBundle } from "../types/message-bundle.js"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"

import _debug from "debug"
import { createMessageBundleSlotAdapter } from "../createMessageBundleSlotAdapter.js"
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
	const _import = createImport(projectPath, fs)

	const resolvedModules = await resolveModules({
		settings,
		_import,
	})

	console.info("worker-resolvedModules", resolvedModules)

	return Comlink.proxy({
		lint: async (settings: ProjectSettings2): Promise<LintReport[]> => {
			// TODO dedbulicate path config
			const messageBundlesPath = projectPath + "/messagebundles/"
			const messagesPath = projectPath + "/messages/"

			const bundleStorage = createSlotStorage<MessageBundle>(
				"bundle-storage-linter",
				16 * 16 * 16 * 16,
				3
			)
			await bundleStorage.connect(fs as NodeishFilesystem, messageBundlesPath, false)

			const messageStorage = createSlotStorage<Message>(
				"message-storage-linter",
				16 * 16 * 16 * 16,
				3
			)
			await messageStorage.connect(fs as NodeishFilesystem, messagesPath, false)

			const rxDbAdapter = createMessageBundleSlotAdapter(bundleStorage, messageStorage, () => {})

			const messageBundles = await rxDbAdapter.getAllMessageBundles()

			const reports: LintReport[] = []
			const promises: Promise<any>[] = []

			for (const messageBundle of messageBundles as MessageBundle[]) {
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

			console.info("lint reports worker", reports)
			return reports
		},
	})
}

Comlink.expose(createLinter, endpoint)
