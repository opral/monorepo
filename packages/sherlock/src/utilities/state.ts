import type { InlangProject, InlangPlugin } from "@inlang/sdk"
import { logger } from "./logger.js"

/**
 * The state of the Visual Studio Code extension (Sherlock).
 */
type State = {
	/**
	 * Inlang project
	 */
	project: InlangProject
	selectedProjectPath: string
	projectsInWorkspace: Array<{ projectPath: string }>
}

let _state: State

/**
 * Set the state.
 *
 * This function now just sets the state and delegates the proxying of project.plugins.get to a helper.
 */
export function setState(state: State) {
	_state = state

	if (state.project) proxyPluginGetMethod(state.project)

	logger.debug("State updated", {
		hasProject: Boolean(state.project),
		selectedProjectPath: state.selectedProjectPath,
		projectsInWorkspace: state.projectsInWorkspace?.length ?? 0,
	})
}

/**
 * Returns the current state.
 *
 * The state is a function because importing a variable
 * is static i.e. if the variable is mutated after an
 * import occurred, the change (might) not be reflected.
 * State that is not reflected = endless bugs.
 */
export function state(): State {
	if (_state === undefined) {
		logger.warn("State accessed before initialization")
	}
	return _state
}

/**
 * Returns the current state without mutating the access pattern.
 *
 * @example
 * const currentState = safeState()
 * if (!currentState) {
 *   logger.warn("Sherlock state unavailable")
 * }
 */
export function safeState(): State | undefined {
	return _state
}

// --- Helper Functions / Remove this when plugins are all converted to the new API plugin.meta API from plugin.addCustomApi ---

/**
 * Proxy the project.plugins.get method to apply migration automatically
 */
function proxyPluginGetMethod(project: InlangProject) {
	const originalGet = project.plugins.get

	// Replace the get function with our proxy
	project.plugins.get = async function (): Promise<InlangPlugin[]> {
		const plugins = await originalGet.call(project.plugins)

		// Create a mutable copy of the plugins array
		const mutablePlugins = [...plugins]

		// Apply the migration logic to plugins
		await migrateAddCustomApi(mutablePlugins)

		return mutablePlugins // Return the migrated plugins
	}
}

/**
 * Migrate the addCustomApi method to meta for a list of plugins.
 */
async function migrateAddCustomApi(plugins: InlangPlugin[]): Promise<void> {
	const project = state().project

	// Migrate each plugin
	for (const plugin of plugins) {
		// If the plugin has an addCustomApi function and meta is not set
		if (plugin.addCustomApi && !plugin.meta) {
			// Call addCustomApi and ensure it's typed correctly
			const customApi: Record<string, unknown> = plugin.addCustomApi({
				settings: await project.settings.get(),
			})

			// Initialize meta if it's not already present
			plugin.meta = plugin.meta || {}

			// Safely iterate over the custom API keys and migrate them to meta
			for (const [apiName, apiValue] of Object.entries(customApi)) {
				if (typeof apiName === "string") {
					// @ts-expect-error
					plugin.meta[apiName] = apiValue
				}
			}

			// Remove the deprecated addCustomApi method
			delete plugin.addCustomApi
		}
	}
}
