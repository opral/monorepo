import { createImport } from "./import.js"
import { endpoint } from "@inlang/sdk/internal/isomorphic-comlink/worker"
import { populateLevel } from "./populateLintLevel.js"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { MessageBundleLintRule, type LintConfig, type LintReport } from "../types/lint.js"
import createSlotStorage from "../../persistence/slotfiles/createSlotStorage.js"
import * as Comlink from "comlink"
import type { NodeishFilesystem } from "@lix-js/fs"
import type { MessageBundle } from "../types/message-bundle.js"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"

import testLintRule from "../../v2-lint-rule/index.js"

import _debug from "debug"
const debug = _debug("sdk-v2:lint-report-worker")

const MessageBundleLintRuleCompiler = TypeCompiler.Compile(MessageBundleLintRule)

const lintConfigs: LintConfig[] = [
	{
		id: "1234",
		ruleId: "messageLintRule.inlang.emptyPattern",
		messageId: undefined,
		bundleId: undefined,
		variantId: undefined,
		level: "error",
	},
]

const bundleCollectionDir = "/messageBundle/"

export async function createLinter(
	projectPath: string,
	moduleURIs: string[],
	fs: Pick<NodeishFilesystemSubset, "readFile" | "readdir" | "mkdir">
) {
	debug("creating linter")
	const _import = createImport(projectPath, fs)

	const modules: unknown[] = await Promise.all(
		moduleURIs.map(async (uri) => {
			const module = await _import(uri)
			return module.default
		})
	)

	const resolvedLintRules = modules.filter((module): module is MessageBundleLintRule =>
		MessageBundleLintRuleCompiler.Check(module)
	)

	const bundleStorage = createSlotStorage<MessageBundle>("bundle-storage", 16 * 16 * 16 * 16, 3)
	await bundleStorage.connect(fs as NodeishFilesystem, bundleCollectionDir, false)
	const messageBundles = await bundleStorage.readAll()
	console.info("messageBundles", messageBundles)

	return Comlink.proxy({
		lint: async (settings: ProjectSettings2): Promise<LintReport[]> => {
			const messageBundles = await bundleStorage.readAll()

			const reports: LintReport[] = []
			const promises: Promise<any>[] = []

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

			console.info("lint reports worker", reports)
			return reports
		},
	})
}

Comlink.expose(createLinter, endpoint)
