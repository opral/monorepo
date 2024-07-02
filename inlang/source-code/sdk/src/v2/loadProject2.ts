import type { Repository } from "@lix-js/client"
import { type ImportFunction, createImport } from "../resolve-modules/import.js"
import { assertValidProjectPath } from "../validateProjectPath.js"
import { normalizePath } from "@lix-js/fs"
import { maybeAddModuleCache } from "../migrations/maybeAddModuleCache.js"
import { createNodeishFsWithAbsolutePaths } from "../createNodeishFsWithAbsolutePaths.js"
import { maybeCreateFirstProjectId } from "../migrations/maybeCreateFirstProjectId.js"
import { loadSettings } from "./settings.js"
import type { InlangProject2 } from "./types/project.js"
import {
	MessageBundle,
	MessageBundleRecord,
	MessageRecord,
	ProjectSettings2,
	type Fix,
	type InstalledLintRule,
	type LintReport,
	type LintResult,
	type Message,
} from "./types/index.js"
import { createDebugImport } from "./import-utils.js"

import {
	createRxDatabase,
	deepEqual,
	stripAttachmentsDataFromDocument,
	type RxCollection,
	type RxConflictHandler,
	type RxConflictHandlerInput,
	type RxConflictHandlerOutput,
} from "rxdb"
import { getRxStorageMemory } from "rxdb/plugins/storage-memory"
import { BehaviorSubject, combineLatest, from, map, switchMap, tap } from "rxjs"
import { resolveModules } from "./resolveModules2.js"
import { createLintWorker } from "./lint/host.js"
import {
	createMessageBundleSlotAdapter,
	startReplication,
} from "./createMessageBundleSlotAdapter.js"
import createSlotStorageWriter from "../persistence/slotfiles/createSlotWriter.js"

import lintRule from "./dev-modules/lint-rule.js"
import { importSequence } from "./import-utils.js"
import makeOpralUppercase from "./dev-modules/opral-uppercase-lint-rule.js"
import missingSelectorLintRule from "./dev-modules/missing-selector-lint-rule.js"
import missingCatchallLintRule from "./dev-modules/missingCatchall.js"

type ProjectState = "initializing" | "resolvingModules" | "loaded"

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

	// Transform legacy fields
	// @ts-ignore
	projectSettings.languageTags = projectSettings.locales
	// @ts-ignore
	projectSettings.sourceLanguageTag = projectSettings.baseLocale

	const projectSettings$ = new BehaviorSubject(projectSettings)
	const lifecycle$ = new BehaviorSubject<ProjectState>("initializing")

	const _import = importSequence(
		createDebugImport({
			"sdk-dev:lint-rule.js": lintRule,
			"sdk-dev:opral-uppercase-lint.js": makeOpralUppercase,
			"sdk-dev:missing-selector-lint-rule.js": missingSelectorLintRule,
			"sdk-dev:missing-catchall-variant": missingCatchallLintRule,
		}),
		createImport(projectPath, nodeishFs)
	)

	const settings$ = projectSettings$.asObservable()

	const modules$ = settings$.pipe(
		switchMap((settings) => {
			lifecycle$.next("resolvingModules")
			return from(resolveModules({ settings, _import }))
		}),
		tap(() => lifecycle$.next("loaded"))
	)

	const installedLintRules$ = new BehaviorSubject([] as InstalledLintRule[])

	combineLatest([modules$, settings$])
		.pipe(
			switchMap(([modules, settings]) => {
				lifecycle$.next("resolvingModules")
				// TODO SDK2 handle module load errors
				const rules = modules.messageBundleLintRules.map(
					(rule) =>
						({
							id: rule.id,
							displayName: rule.displayName,
							description: rule.description,
							module:
								modules.meta.find((m) => m.id.includes(rule.id))?.module ??
								"Unknown module. You stumbled on a bug in inlang's source code. Please open an issue.",
							// default to warning, see https://github.com/opral/monorepo/issues/1254
							level: "warning", // TODO SDK2 settings.messageLintRuleLevels?.[rule.id] ?? "warning",
							settingsSchema: rule.settingsSchema,
						} satisfies InstalledLintRule)
				)
				return from([rules])
			})
		)
		.subscribe({
			next: (rules) => installedLintRules$.next(rules),
			error: (err) => console.error(err),
		})

	let abortController: AbortController | undefined

		// Watching for changes in settings file and updating the subject
	;(() => {
		abortController = new AbortController()

		// NOTE: watch will not throw an exception since we don't await it here.
		const watcher = nodeishFs.watch(settingsFilePath, {
			signal: abortController.signal,
			persistent: false,
		})

		;(async () => {
			try {
				//eslint-disable-next-line @typescript-eslint/no-unused-vars
				for await (const event of watcher) {
					const newSettings = await loadSettings({ settingsFilePath, nodeishFs })
					projectSettings$.next(newSettings)
				}
			} catch (err: any) {
				if (err.name === "AbortError") return
				// https://github.com/opral/monorepo/issues/1647
				// the file does not exist (yet)
				// this is not testable beacause the fs.watch api differs
				// from node and lix. lenghty
				else if (err.code === "ENOENT") return
				throw err
			}
		})()
	})()

	const linter = await createLintWorker(projectPath, projectSettings, nodeishFs)

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


	const bundleStorage = await createSlotStorageWriter<MessageBundleRecord>({
		fileNameCharacters: 3,
		slotsPerFile: 16 * 16 * 16 * 16,
		fs: nodeishFs,
		path: messageBundlesPath,
		watch: true,
	})

	const messageStorage = await createSlotStorageWriter<MessageRecord>({
		fileNameCharacters: 3,
		slotsPerFile: 16 * 16 * 16 * 16,
		fs: nodeishFs,
		path: messagesPath,
		watch: true,
	})

	let lintsRunning = false
	let lintsPending = false
	const lintReports$ = new BehaviorSubject<LintResult>({})
	const adapter = createMessageBundleSlotAdapter(
		bundleStorage,
		messageStorage,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		async (source, bundle) => {
			if (source === "adapter") {
				if (lintsRunning) {
					lintsPending = true
					return
				}
				lintsRunning = true

				// eslint-disable-next-line no-constant-condition
				while (true) {
					lintsPending = false
					const lintresults = await linter.lint(projectSettings$.value)

					lintReports$.next(lintresults)
					if (!lintsPending) {
						break
					}
				}
				lintsRunning = false
			}
		},
		lintReports$
	)

	// add the hero collection
	await database.addCollections({
		messageBundles: {
			schema: MessageBundle as any as typeof MessageBundle &
				Readonly<{ version: number; primaryKey: string; additionalProperties: false | undefined }>,
			conflictHandler: adapter.conflictHandler,
		},
	})

	await startReplication(database.collections.messageBundles, adapter).awaitInitialReplication()

	const setSettings = async (newSettings: ProjectSettings2) => {
		// projectSettings$.next(newSettings); // Update the observable
		await nodeishFs.writeFile(settingsFilePath, JSON.stringify(newSettings, null, 2)) // Write the new settings to the file
	}

	return {
		id: projectId,
		settings: projectSettings$,
		setSettings: setSettings,
		messageBundleCollection: database.collections.messageBundles,
		installed: {
			lintRules: installedLintRules$,
			plugins: [],
		},
		lintReports$,
		internal: {
			bundleStorage,
			messageStorage,
		},
		fix: async (report: LintReport, fix: Fix<LintReport>) => {
			const fixed = await linter.fix(report, fix)
			await database.collections.messageBundles.upsert(fixed)
		},
	}
}

