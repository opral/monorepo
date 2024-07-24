import type { BehaviorSubject, Observer, Subscription } from "rxjs"
import type {
	InstalledLintRule,
	InstalledPlugin,
	ProjectSettings2,
	// LintResult,
	// Message,
	// MessageBundle,
	// MessageBundleRecord,
	// MessageRecord,
	// ProjectSettings2,
} from "./index.js"
import type { Bundle, Database, Message, NestedBundle, NestedMessage, Variant } from "./schema.js"
import type {
	DeleteQueryBuilder,
	DeleteResult,
	InsertQueryBuilder,
	InsertResult,
	SelectQueryBuilder,
	UpdateQueryBuilder,
	UpdateResult,
} from "kysely"

export type InlangProject = {
	/**#
	 * The project's id.
	 */
	id: string

	installed: {
		plugins: InstalledPlugin[] // TODO check how we get those subscribable
		lintRules: BehaviorSubject<InstalledLintRule[]> // TODO check how we get those subscribable
	}

	settings: {
		get: () => ProjectSettings2
		set: (settings: ProjectSettings2) => Promise<void>
		subscribe: (
			observerOrNext?: Partial<Observer<ProjectSettings2>> | ((value: ProjectSettings2) => void),
			error?: (error: any) => void,
			complete?: () => void
		) => Subscription
	}
	bundle: {
		select: SelectQueryBuilder<Database, "bundle", object>
		insert: (bundle: NestedBundle) => InsertQueryBuilder<Database, "bundle", InsertResult>
		update: (
			bundle: Partial<Bundle> & { id: string }
		) => UpdateQueryBuilder<Database, "bundle", "bundle", UpdateResult>
		delete: (bundle: Bundle) => DeleteQueryBuilder<Database, "bundle", DeleteResult>
	}
	message: {
		select: SelectQueryBuilder<Database, "message", object>
		insert: (message: NestedMessage) => InsertQueryBuilder<Database, "message", InsertResult>
		update: (
			message: Partial<Message> & { id: string }
		) => UpdateQueryBuilder<Database, "message", "message", UpdateResult>
		delete: (message: Message) => DeleteQueryBuilder<Database, "message", DeleteResult>
	}
	variant: {
		select: SelectQueryBuilder<Database, "variant", object>
		insert: (variant: Variant) => InsertQueryBuilder<Database, "variant", InsertResult>
		update: (variant: Variant) => UpdateQueryBuilder<Database, "variant", "variant", UpdateResult>
		delete: (bundle: Variant) => DeleteQueryBuilder<Database, "variant", DeleteResult>
	}
	// reports: {
	// 	select: any
	// }
	// js libraries containing lint rules, importers, exporters, code matchers, registries (icu2)
	// modules: {
	// 	// TODO provide import exporter plugins: Subscribable<InstalledPlugin[]>
	// 	messageBundleLintRules: InstalledMessageLintRule[]
	// }
	// errors: Subscribable<
	// 	((typeof ModuleResolutionError)[keyof typeof ModuleResolutionError] | Error)[]
	// >
	// TODO clearify what this is used for with Felix
	// customApi: Subscribable<ResolvedPluginApi["customApi"]>
	// TODO make this an rxDocument and use another persistence
	// settings: Subscribable<ProjectSettings2>
	// setSettings: (config: ProjectSettings2) => void // Result<void, RuntimeError.ProjectSettingsInvalidError>

	// bundle: {
	// 	selectNested:
	// }

	// fix: <Report extends LintReport>(lintReport: Report, fix: Fix<Report>) => Promise<void>
	close: () => void
}
