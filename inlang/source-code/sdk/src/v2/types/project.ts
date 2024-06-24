import type { Result } from "@inlang/result"
import type { Subscribable } from "rxjs"
import type {
	InstalledMessageLintRule,
	LintReport,
	Message,
	MessageBundle,
	ProjectSettings2,
} from "./index.js"
import * as RuntimeError from "./errors.js"
import type { RxCollection } from "rxdb"
import type createSlotStorage from "../../persistence/slotfiles/createSlotStorage.js"

export type InlangProject2 = {
	/**#
	 * The project's id.
	 */
	id: string

	// js libraries containing lint rules, importers, exporters, code matchers, registries (icu2)
	// modules: {
	// 	// TODO provide import exporter plugins: Subscribable<InstalledPlugin[]>
	// 	messageLintRules: InstalledMessageLintRule[]
	// }
	// errors: Subscribable<
	// 	((typeof ModuleResolutionError)[keyof typeof ModuleResolutionError] | Error)[]
	// >
	// TODO clearify what this is used for with Felix
	// customApi: Subscribable<ResolvedPluginApi["customApi"]>
	// TODO make this an rxDocument and use another persistence
	settings: Subscribable<ProjectSettings2>
	// setSettings: (config: ProjectSettings) => Result<void, RuntimeError.ProjectSettingsInvalidError>

	messageBundleCollection: RxCollection<MessageBundle>
	// lintReportCollection: RxCollection<LintReport>

    internal: {
        bundleStorage: ReturnType<typeof createSlotStorage<MessageBundle>>,
        messageStorage: ReturnType<typeof createSlotStorage<Message>>,
    }
}
