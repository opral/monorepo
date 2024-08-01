import {
	Kysely,
	ParseJSONResultsPlugin,
	sql,
	type RawBuilder,
	type SelectQueryBuilder,
} from "kysely"
import { SQLocalKysely } from "sqlocal/kysely"
import type {
	Bundle,
	Database,
	Message,
	NestedBundle,
	NewBundle,
	NewMessage,
	NewVariant,
	Variant,
} from "./types/schema.js"
import { jsonArrayFrom } from "kysely/helpers/sqlite"
import { loadSettings } from "./settings.js"
import { BehaviorSubject, combineLatest, from, switchMap, tap } from "rxjs"
import { createDebugImport, importSequence } from "./import-utils.js"

// development only
// import lintRule from "./dev-modules/lint-rule.js"
// import makeOpralUppercase from "./dev-modules/opral-uppercase-lint-rule.js"
// import missingSelectorLintRule from "./dev-modules/missing-selector-lint-rule.js"
// import missingCatchallLintRule from "./dev-modules/missingCatchall.js"
import type { InstalledLintRule, ProjectSettings2 } from "./types/project-settings.js"
import type { InlangProject } from "./types/project.js"
import { resolvePlugins } from "./resolvePlugins2.js"
// import type { LanguageTag } from "@inlang/plugin"

// extend the SQLocalKysely class to expose a rawSql function
// needed for non parametrized queries
class SQLocalKyselyWithRaw extends SQLocalKysely {
	rawSql = async <T extends Record<string, any>[]>(rawSql: string) => {
		const { rows, columns } = await this.exec(rawSql, [], "all")
		//@ts-ignore
		return this.convertRowsToObjects(rows, columns) as T
	}
}

type ProjectState = "initializing" | "resolvingModules" | "loaded"

/**
 * @param path - for now we expect settings file and sqlite file beein checked out under the given path - later we checkout the files manually from the repo?
 * @returns
 */
export async function loadProjectOpfs(args: { inlangFolderPath: string }): Promise<InlangProject> {
	const opfsRoot = await navigator.storage.getDirectory()

	const projectDir = await opfsRoot.getDirectoryHandle(args.inlangFolderPath)

	// loading the settings from opfs
	const settingsFilePath = "settings.json"
	const settingsFileHandle = await projectDir.getFileHandle(settingsFilePath)
	const settingsFile = await settingsFileHandle.getFile()
	const settingsFileContent = await settingsFile.arrayBuffer()

	const projectSettings = await loadSettings({
		settingsFileContent: settingsFileContent,
	})

	// TODO SDK-v2 LIX listen to changes on the settings file - how do multiple instance of a project get informed about changes?
	const projectSettings$ = new BehaviorSubject(projectSettings)

	// TODO SDK-v2 LIX how to deal with plugins we want to load?
	const _import = importSequence()
	/**
	 * Lint rules are now Lix validation rules, therefore this needs to be reimplemented
	 */
	// 	createDebugImport({
	// 		"sdk-dev:lint-rule.js": lintRule,
	// 		"sdk-dev:opral-uppercase-lint.js": makeOpralUppercase,
	// 		"sdk-dev:missing-selector-lint-rule.js": missingSelectorLintRule,
	// 		"sdk-dev:missing-catchall-variant": missingCatchallLintRule,
	// 	}),
	// createImport(projectPath, nodeishFs)
	const lifecycle$ = new BehaviorSubject<ProjectState>("initializing")

	const settings$ = projectSettings$.asObservable()

	const modules$ = settings$.pipe(
		switchMap((settings: any) => {
			lifecycle$.next("resolvingModules")
			return from(resolvePlugins({ settings, _import }))
		}),
		tap(() => lifecycle$.next("loaded"))
	)

	const installedLintRules$ = new BehaviorSubject([] as InstalledLintRule[])

	combineLatest([modules$, settings$])
		.pipe(
			switchMap(([modules]) => {
				lifecycle$.next("resolvingModules")
				// TODO SDK-v2 LINT handle module load errors
				const rules = (modules as any).messageBundleLintRules.map(
					(rule: any) =>
						({
							id: rule.id,
							displayName: rule.displayName,
							description: rule.description,
							module:
								(modules as any).meta.find((m: { id: string | any[] }) => m.id.includes(rule.id))
									?.module ??
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

	const sqliteDbFilePath = args.inlangFolderPath + "/inlang.sqlite"

	// TODO SDK-v2 LINT SQLocalKysely currently only support (1 client) <-> (1 instance worker) communication with an db instance for reports to work we need (n clients) <-> (1 instance) communication
	const sqliteDb = new SQLocalKyselyWithRaw(sqliteDbFilePath)
	const { dialect, sql, rawSql } = sqliteDb

	const db = new Kysely<Database>({
		dialect,
		plugins: [new ParseJSONResultsPlugin()],
	})

	return {
		// TODO SDK-v2 LIX
		id: "TODO SDK-v2",
		// db,
		// sql,
		// rawSql,
		// TODO SDK-v2 API if we expose only the api, what helper Method should the SDK provide insert/update/delete for bundle/message/variant? how shall we deal with nested queries?
		// db: db,

		installed: {
			lintRules: installedLintRules$,
			plugins: [],
		},
		settings: {
			get: () => projectSettings$.getValue(),
			set: async (settings: ProjectSettings2) => {
				// TODO SDK-v2 LIX write the file back to lix
			},
			subscribe: () => projectSettings$.subscribe(),
		},

		bundle: {
			/*
			search: (args: { lintRulesIds: string[], locales: LanguageTag[], bundleIds: string[], text: string }): string[] {
				const query = // my fancy search query
				return {
					result: async () => {

					}
					subscribe: (cb) => {
						
						return {
							unsubscribe: () => {

							}
						}
					}
				}
			},
			*/
			select: db.selectFrom("bundle"),
			insert: (bundle: Bundle) => {
				return db.insertInto("bundle").values({
					id: bundle.id,
					alias: json(bundle.alias) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
				})
			},
			update: (bundle: Partial<Bundle> & { id: string }) => {
				const bundleProperties = structuredClone(bundle as any) // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
				delete bundleProperties.id
				if (bundle.alias) {
					bundleProperties.alias = json(bundle.alias) as any
				}
				return db.updateTable("bundle").set(bundleProperties).where("bundle.id", "=", bundle.id)
			},
			delete: (bundle: Bundle) => {
				return db.deleteFrom("bundle").where("bundle.id", "=", bundle.id)
			},
		},
		message: {
			select: db.selectFrom("message"),
			insert: (message: Message) => {
				return db.insertInto("message").values({
					id: message.id,
					bundleId: message.bundleId,
					locale: message.locale,
					declarations: json(message.declarations) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
					selectors: json(message.selectors) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
				})
			},
			update: (message: Partial<Message> & { id: string }) => {
				const messageProperties = structuredClone(message as any) // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
				delete messageProperties.id
				delete messageProperties.variants
				if (message.declarations) {
					messageProperties.declarations = json(message.declarations) as any
				}
				if (message.selectors) {
					messageProperties.selectors = json(message.selectors) as any
				}

				return db.updateTable("message").set(messageProperties).where("message.id", "=", message.id)
			},
			delete: (message: Message) => {
				return db.deleteFrom("message").where("message.id", "=", message.id)
			},
		},
		variant: {
			select: db.selectFrom("variant"),
			insert: (variant: Variant) => {
				return db.insertInto("variant").values({
					id: variant.id,
					messageId: variant.messageId,
					match: json(variant.match) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
					pattern: json(variant.pattern) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
				})
			},
			update: (variant: Partial<Variant> & { id: string }) => {
				const variantProperties = structuredClone(variant as any) // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
				delete variantProperties.id
				if (variant.match) {
					variantProperties.match = json(variant.match) as any
				}
				if (variant.pattern) {
					variantProperties.pattern = json(variant.pattern) as any
				}

				return db.updateTable("variant").set(variantProperties).where("variant.id", "=", variant.id)
			},
			delete: (variant: Variant) => {
				return db.deleteFrom("variant").where("variant.id", "=", variant.id)
			},
		},
		// fix: async (report: LintReport, fix: Fix<LintReport>) => {
		// 	// TODO SDK-v2 LINT implement fix
		// 	// const fixed = await linter.fix(report, fix)
		// 	// await database.collections.messageBundles.upsert(fixed)
		// },
		close: () => {
			// TODO SDK-v2 LIX lifecylce of the database? close database again
		},
	}
}

export const populateMessages = (bundleSelect: SelectQueryBuilder<Database, "bundle", object>) => {
	return bundleSelect.select((eb) => [
		// select all columns from bundle
		"id",
		"alias",
		// select all columns from messages as "messages"
		jsonArrayFrom(
			populateVariants(eb.selectFrom("message")).whereRef(
				"message.bundleId",
				"=",
				"bundle.id" as any
			)
		).as("messages"),
	])
}

export const populateVariants = (
	messageSelect: SelectQueryBuilder<Database, "message", object>
) => {
	return messageSelect.select((eb) => [
		// select all columns from message
		"id",
		"bundleId",
		"locale",
		"declarations",
		"selectors",
		// select all columns from variants as "variants"
		jsonArrayFrom(
			eb
				.selectFrom("variant")
				.select(["id", "messageId", "match", "pattern"])
				.whereRef("variant.messageId", "=", "message.id")
		).as("variants"),
	])
}

function json<T>(value: T): RawBuilder<T> {
	// NOTE we cant use jsonb for now since kisley
	// - couldn't find out how to return json instead of bytes in a selectFrom(...).select statment
	//  return sql`jsonb(${JSON.stringify(value)})`
	return sql`json(${JSON.stringify(value)})`
}

const insertBundles = (db: Kysely<Database>) => {
	return async (bundleToInsert: NestedBundle[]) => {
		let bundles: NewBundle[] = []
		let messages: NewMessage[] = []
		let variants: NewVariant[] = []
		// let reports: LintReport[] = []

		await db.transaction().execute(async (tsx) => {
			for (const sdkBundle of bundleToInsert) {
				// TODO move id generation to inlang-sdk
				// const sdkBundle = createBundle(['de-DE', 'en-US'], 0, 0, 0)

				// mockReports(sdkBundle).forEach(report => {
				//   const reportToAdd:any = report
				//   reportToAdd.fixes = json(reportToAdd.fixes)
				//   reportToAdd.target = json(reportToAdd.target)
				//   reports.push(reportToAdd)
				// });

				for (const message of sdkBundle.messages) {
					for (const variant of message.variants)
						variants.push({
							id: variant.id,
							messageId: message.id,
							match: json(variant.match),
							pattern: json(variant.pattern),
						} as any)
					messages.push({
						bundleId: message.bundleId,
						id: message.id,
						locale: message.locale,
						declarations: json(message.declarations),
						selectors: json(message.selectors),
					} as any)
				}

				bundles.push({
					alias: json(sdkBundle.alias),
					id: sdkBundle.id,
				} as any)

				// manual batching to avoid too many db operations
				if (bundles.length > 300) {
					const now = new Date().getTime()
					console.time("Creating " + bundles.length + " Bundles/Messages/Variants " + now)

					// TODO make in one query
					await tsx.insertInto("bundle").values(bundles).execute()
					await tsx
						.insertInto("message")
						.values(messages as any)
						.execute()
					await tsx
						.insertInto("variant")
						.values(variants as any)
						.execute()

					// await tsx
					//   .insertInto("LintReport")
					//   .values(reports as any)
					//   .execute();

					console.timeEnd("Creating " + bundles.length + " Bundles/Messages/Variants " + now)
					bundles = []
					messages = []
					variants = []
					// reports = [];
				}
			}
			// insert remaining bundles
			if (bundles.length > 0) {
				const now = new Date().getTime()
				console.time("Creating " + bundles.length + " Bundles/Messages/Variants " + now)
				await tsx.insertInto("bundle").values(bundles).execute()
				await tsx
					.insertInto("message")
					.values(messages as any)
					.execute()

				await tsx
					.insertInto("variant")
					.values(variants as any)
					.execute()
				// await tsx
				// .insertInto("LintReport")
				// .values(reports as any)
				// .execute();
				console.timeEnd("Creating " + bundles.length + " Bundles/Messages/Variants " + now)
			}
		})
	}
}
