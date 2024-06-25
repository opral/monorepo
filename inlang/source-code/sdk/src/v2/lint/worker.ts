import type { NodeishFilesystemSubset } from "@inlang/plugin"
import * as Comlink from "comlink"
import { createImport } from "./import.js"
import { endpoint } from "comlink-node/worker"
import createSlotStorage from "../../persistence/slotfiles/createSlotStorage.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import type { MessageBundleLintRule, LintConfig, LintReport } from "../types/lint.js"
import type { MessageBundle } from "../types/message-bundle.js"
import { populateLevel } from "./populateLintLevel.js"
import type { ProjectSettings2 } from "../types/project-settings.js"

const lintConfigs: LintConfig[] = [
	{
		id: "1234",
		messageId: undefined,
		bundleId: undefined,
		ruleId: "messageLintRule.inlang.emptyPattern",
		variantId: undefined,
		level: "error",
	},
]

const bundleCollectionDir = "/messageBundle/"

export async function createLinter(
	projectPath: string,
	lintRules: string[],
	fs: Pick<NodeishFilesystemSubset, "readFile">
) {
	console.info(lintRules)
	const _import = createImport(projectPath, fs)

	// TODO use resolveModules
	const resolvedLintRules: MessageBundleLintRule[] = await Promise.all(
		lintRules.map(async (uri) => {
			const module = await _import(uri)
			return module.default as MessageBundleLintRule
		})
	)

	console.info(resolvedLintRules)

	const fullFs = new Proxy(fs as NodeishFilesystem, {
		get(target, prop) {
			if (prop in target) {
				return target[prop as keyof NodeishFilesystem]
			} else {
				throw new Error("nope")
			}
		},
	})

	const bundleStorage = createSlotStorage<MessageBundle>("bundle-storage", 16 * 16 * 16 * 16, 3)
	await bundleStorage.connect(fullFs, projectPath + bundleCollectionDir)

	return {
		lint: async (settings: ProjectSettings2): Promise<LintReport[]> => {
			console.info(settings)
			const messageBundles = await bundleStorage.readAll()

			const reports: LintReport[] = []
			const promises: Promise<any>[] = []

			// generate lint reports
			for (const messageBundle of messageBundles) {
				for (const lintRule of resolvedLintRules) {
					const promise = lintRule.run({
						messageBundle: messageBundle.data,
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
			return reports
		},
	}
}

Comlink.expose(createLinter, endpoint)
