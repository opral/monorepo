import type { Repository } from "@lix-js/client"
import { type ImportFunction, createImport } from "../resolve-modules/import.js"
import { assertValidProjectPath } from "../validateProjectPath.js"
import { normalizePath } from "@lix-js/fs"
import { maybeAddModuleCache } from "../migrations/maybeAddModuleCache.js"
import { createNodeishFsWithAbsolutePaths } from "../createNodeishFsWithAbsolutePaths.js"
import { maybeCreateFirstProjectId } from "../migrations/maybeCreateFirstProjectId.js"
import { loadSettings } from "./settings.js"
import type { InlangProject2 } from "./types/project.js"
import { MessageBundle, type LintFix, type LintReport, type Message } from "./types/index.js"
import createSlotStorage from "../persistence/slotfiles/createSlotStorage.js"
import { createDebugImport } from "./import-utils.js"

import { createRxDatabase, type RxCollection } from "rxdb"
import { getRxStorageMemory } from "rxdb/plugins/storage-memory"
import { BehaviorSubject } from "rxjs"
import { resolveModules } from "./resolveModules2.js"
import { createLintWorker } from "./lint/host.js"
import {
	createMessageBundleSlotAdapter,
	startReplication,
} from "./createMessageBundleSlotAdapter.js"

import lintRule from "./dev-modules/lint-rule.js"
import { importSequence } from "./import-utils.js"

/**
 *
 * Lifecycle of load Project:
 *
 * init - the async function has not yet returned
 * installing dependencies -
 *
 *
 * @param projectPath - Absolute path to the inlang settings file.
 * @param repo - An instance of a lix repo as returned by `openRepository`.
 * @param _import - Use `_import` to pass a custom import function for testing,
 *   and supporting legacy resolvedModules such as CJS.
 * @param appId - The app id to use for telemetry e.g "app.inlang.badge"
 *
 */
export async function loadProject(args: {
	projectPath: string
	repo: Repository
	appId?: string
	_import?: ImportFunction
}): Promise<InlangProject2> {
	// TODO SDK2 check if we need to use the new normalize path here
	const projectPath = normalizePath(args.projectPath)
	const messageBundlesPath = projectPath + "/messagebundles/"
	const messagesPath = projectPath + "/messages/"
	const settingsFilePath = projectPath + "/settings.json"
	const projectIdPath = projectPath + "/project_id"

	// -- validation --------------------------------------------------------
	// the only place where throwing is acceptable because the project
	// won't even be loaded. do not throw anywhere else. otherwise, apps
	// can't handle errors gracefully.
	assertValidProjectPath(projectPath)

	const nodeishFs = createNodeishFsWithAbsolutePaths({
		projectPath,
		nodeishFs: args.repo.nodeishFs,
	})

	await maybeAddModuleCache({ projectPath, repo: args.repo })
	await maybeCreateFirstProjectId({ projectPath, repo: args.repo })

	// no need to catch since we created the project ID with "maybeCreateFirstProjectId" earlier
	const projectId = await nodeishFs.readFile(projectIdPath, { encoding: "utf-8" })

	const projectSettings = await loadSettings({ settingsFilePath, nodeishFs })

	// @ts-ignore
	projectSettings.languageTags = projectSettings.locales
	// @ts-ignore
	projectSettings.sourceLanguageTag = projectSettings.baseLocale

	const projectSettings$ = new BehaviorSubject(projectSettings)

	const _import = importSequence(
		createDebugImport({
			"sdk-dev:lint-rule.js": lintRule,
		}),
		createImport(projectPath, nodeishFs)
	)

	const modules = await resolveModules({
		settings: projectSettings,
		_import,
	})

	console.info("resolvedModules", modules)

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const modules$ = new BehaviorSubject(modules)

	// rxdb with memory storage configured
	const database = await createRxDatabase<{
		messageBundles: RxCollection<MessageBundle>
	}>({
		name: "messageSdkDb",
		storage: getRxStorageMemory(),
		// deactivate inter browser tab optimization
		multiInstance: true,
		ignoreDuplicate: true,
	})

	// add the hero collection
	await database.addCollections({
		messageBundles: {
			schema: MessageBundle as any as typeof MessageBundle &
				Readonly<{ version: number; primaryKey: string; additionalProperties: false | undefined }>,
		},
	})

	const bundleStorage = await createSlotStorage<MessageBundle>({
		fileNameCharacters: 3,
		slotsPerFile: 16 * 16 * 16 * 16,
		fs: nodeishFs,
		path: messageBundlesPath,
		watch: true,
		readonly: false,
	})

	const messageStorage = await createSlotStorage<Message>({
		fileNameCharacters: 3,
		slotsPerFile: 16 * 16 * 16 * 16,
		fs: nodeishFs,
		path: messagesPath,
		watch: true,
		readonly: false,
	})

	const linter = await createLintWorker(projectPath, projectSettings, nodeishFs)

	const lintReports$ = new BehaviorSubject<LintReport[]>([])
	const adapter = createMessageBundleSlotAdapter(
		bundleStorage,
		messageStorage,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		async (source, bundle) => {
			if (source === "adapter") {
				const lintresults = await linter.lint(projectSettings)
				lintReports$.next(lintresults)
			}
		}
	)
	await startReplication(database.collections.messageBundles, adapter).awaitInitialReplication()

	return {
		id: projectId,
		settings: projectSettings$,
		messageBundleCollection: database.collections.messageBundles,
		installed: {
			lintRules: [],
			plugins: [],
		},
		lintReports$,
		internal: {
			bundleStorage,
			messageStorage,
		},
		fix: async (report: LintReport, fix: LintFix) => {
			const fixed = await linter.fix(report, fix)
			database.collections.messageBundles.upsert(fixed)
		},
	}
}
