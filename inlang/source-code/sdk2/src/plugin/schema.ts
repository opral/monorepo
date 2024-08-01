import type { TObject } from "@sinclair/typebox"
import type { NestedBundle } from "../schema/schema.js"
import type { ProjectSettings } from "../schema/settings.js"

export type InlangPlugin2 = {
	/**
	 * The key of the plugin.
	 */
	key: string
	apiVersion: "2"
	settingsSchema?: TObject
	/**
	 * Import / Export files.
	 * see https://linear.app/opral/issue/MESDK-157/sdk-v2-release-on-sqlite
	 */
	toBeImportedFiles?: (args: {
		settings: ProjectSettings
		nodeFs: unknown
	}) => Promise<Array<ResourceFile>> | Array<ResourceFile>
	importFiles?: (args: { files: Array<ResourceFile> }) => { bundles: NestedBundle }
	exportFiles?: (args: { bundles: NestedBundle; settings: ProjectSettings }) => Array<ResourceFile>
	/**
	 * Define app specific APIs.
	 *
	 * @example
	 * addCustomApi: () => ({
	 *   "app.inlang.ide-extension": {
	 *     messageReferenceMatcher: () => {}
	 *   }
	 *  })
	 */
	addCustomApi?: (args: { settings: ProjectSettings }) => Record<string, unknown>
}

export type ResourceFile = {
	path: string
	content: string
	pluginKey: InlangPlugin2["key"]
}
