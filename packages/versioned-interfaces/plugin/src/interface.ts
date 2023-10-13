import { type Static, Type, type TTemplateLiteral, type TLiteral } from "@sinclair/typebox"
import type { NodeishFilesystem } from "@lix-js/fs"
import type { Message } from "@inlang/message"
import type { JSONObject } from "@inlang/json-types"
import type { CustomApiInlangIdeExtension } from "./customApis/app.inlang.ideExtension.js"
import { Translatable } from "@inlang/translatable"
import type { ExternalProjectSettings, ProjectSettings } from "@inlang/project-settings"

/**
 * The filesystem is a subset of project lisa's nodeish filesystem.
 *
 * - only uses minimally required functions to decrease the API footprint on the ecosystem.
 */
export type NodeishFilesystemSubset = Pick<
	NodeishFilesystem,
	"readFile" | "readdir" | "mkdir" | "writeFile"
>

// ---------------------------- RUNTIME VALIDATION TYPES ---------------------------------------------

/**
 * The plugin API is used to extend inlang's functionality.
 *
 * You can use your own settings by extending the plugin with a generic:
 *
 * ```ts
 * 	type PluginSettings = {
 *  	storagePath: string
 * 	}
 *
 * 	const plugin: Plugin<{
 * 		"plugin.your.id": PluginSettings
 * 	}>
 * ```
 */
export type Plugin<
	ExternalSettings extends Record<keyof ExternalProjectSettings, JSONObject> | unknown = unknown
> = Omit<Static<typeof Plugin>, "loadMessages" | "saveMessages" | "addCustomApi"> & {
	/**
	 * Load messages.
	 */
	loadMessages?: (args: {
		settings: ProjectSettings & ExternalSettings
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<Message[]> | Message[]
	saveMessages?: (args: {
		messages: Message[]
		settings: ProjectSettings & ExternalSettings
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<void> | void
	/**
	 * Define app specific APIs.
	 *
	 * @example
	 * addCustomApi: () => ({
	 * 	 "app.inlang.ide-extension": {
	 * 	   messageReferenceMatcher: () => {}
	 * 	 }
	 *  })
	 */
	addCustomApi?: (args: {
		settings: ProjectSettings & ExternalSettings
	}) =>
		| Record<`app.${string}.${string}`, unknown>
		| { "app.inlang.ideExtension": CustomApiInlangIdeExtension }
}

export const Plugin = Type.Object(
	{
		id: Type.String({
			pattern: "^plugin\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)$",
			examples: ["plugin.namespace.id"],
		}) as unknown as TTemplateLiteral<[TLiteral<`plugin.${string}.${string}`>]>,
		displayName: Translatable(Type.String()),
		description: Translatable(Type.String()),
		loadMessages: Type.Optional(Type.Any()),
		saveMessages: Type.Optional(Type.Any()),
		/**
		 * @deprecated removed
		 */
		detectedLanguageTags: Type.Optional(Type.Any()),
		addCustomApi: Type.Optional(Type.Any()),
	},
	{ additionalProperties: false }
)
