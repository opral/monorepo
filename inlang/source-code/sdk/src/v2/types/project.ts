import type { Observable, Subscribable } from "rxjs"
import type {
	Fix,
	InstalledLintRule,
	InstalledPlugin,
	LintReport,
	Message,
	MessageBundle,
	ProjectSettings2,
} from "./index.js"
import type { RxCollection } from "rxdb"
import type createSlotWriter from "../../persistence/slotfiles/createSlotWriter.js"

export type InlangProject2 = {
	/**#
	 * The project's id.
	 */
	id: string

	installed: {
		plugins: InstalledPlugin[] // TODO check how we get those subscribable
		lintRules: Observable<InstalledLintRule[]> // TODO check how we get those subscribable
	}

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
	settings: Subscribable<ProjectSettings2>
	setSettings: (config: ProjectSettings2) => void // Result<void, RuntimeError.ProjectSettingsInvalidError>

	messageBundleCollection: RxCollection<MessageBundle>
	// lintReportCollection: RxCollection<LintReport>
	lintReports$: Subscribable<LintReport[]>

	internal: {
		bundleStorage: Awaited<ReturnType<typeof createSlotWriter<MessageBundle>>>
		messageStorage: Awaited<ReturnType<typeof createSlotWriter<Message>>>
	}

	fix: <Report extends LintReport>(lintReport: Report, fix: Fix<Report>) => Promise<void>
}
