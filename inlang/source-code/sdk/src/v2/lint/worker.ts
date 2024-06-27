import { createImport } from "./import.js"
import { endpoint } from "comlink-node/worker"
import { populateLevel } from "./populateLintLevel.js"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { MessageBundleLintRule, type LintConfig, type LintReport } from "../types/lint.js"
import createSlotStorage from "../../persistence/slotfiles/createSlotStorage.js"
import * as Comlink from "comlink"
import type { NodeishFilesystem } from "@lix-js/fs"
import type { Message, MessageBundle } from "../types/message-bundle.js"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"

import _debug from "debug"
import { createMessageBundleSlotAdapter } from "../createMessageBundleSlotAdapter.js"
const debug = _debug("sdk-v2:lint-report-worker")

const MessageBundleLintRuleCompiler = TypeCompiler.Compile(MessageBundleLintRule)

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

	const invalidModuleErrors = modules
		.filter((module) => !MessageBundleLintRuleCompiler.Check(module))
		.flatMap((module) => [...MessageBundleLintRuleCompiler.Errors(module)])

	if (invalidModuleErrors.length > 0) {
		console.error("invalidModuleErrors", invalidModuleErrors)
	}

	const resolvedLintRules = modules.filter((module): module is MessageBundleLintRule =>
		MessageBundleLintRuleCompiler.Check(module)
	)

	return Comlink.proxy({
		lint: async (settings: ProjectSettings2): Promise<LintReport[]> => {
			// TODO dedbulicate path config
			const messageBundlesPath = projectPath + "/messagebundles/"
			const messagesPath = projectPath + "/messages/"

			const bundleStorage = await createSlotStorage<MessageBundle>({
				fileNameCharacters: 3,
				slotsPerFile: 16 * 16 * 16 * 16,
				fs,
				path: messageBundlesPath,
				watch: false,
				readonly: true,
			})

			const messageStorage = await createSlotStorage<Message>({
				fileNameCharacters: 3,
				slotsPerFile: 16 * 16 * 16 * 16,
				fs,
				path: messageBundlesPath,
				watch: false,
				readonly: true,
			})

			const rxDbAdapter = createMessageBundleSlotAdapter(bundleStorage, messageStorage, () => {})

			const messageBundles = await rxDbAdapter.getAllMessageBundles()

			const reports: LintReport[] = []
			const promises: Promise<any>[] = []

			for (const messageBundle of messageBundles as MessageBundle[]) {
				for (const lintRule of resolvedLintRules) {
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
