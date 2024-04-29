import {
	type Static,
	Type,
	type TTemplateLiteral,
	type TLiteral,
	type TObject,
} from "@sinclair/typebox"
import type { NodeishFilesystem } from "@lix-js/fs"
import type { JSONObject } from "@inlang/json-types"
import type { AST } from "@inlang/sdk"
import { Translatable } from "@inlang/translatable"
import type { ExternalProjectSettings, ProjectSettings } from "@inlang/project-settings"

/**
 * The filesystem is a subset of project lisa's nodeish filesystem.
 *
 * - only uses minimally required functions to decrease the API footprint on the ecosystem.
 */
export type NodeishFilesystemSubset = Pick<
	NodeishFilesystem,
	"readFile" | "readdir" | "mkdir" | "writeFile" | "watch"
>

// ---------------------------- RUNTIME VALIDATION TYPES ---------------------------------------------

/**
 * The import API is used to import messages from external formants
 */
export type Importer<
	ExternalSettings extends Record<keyof ExternalProjectSettings, JSONObject> | unknown = unknown
> = Omit<Static<typeof Importer>, "importMessages" | "settingsSchema"> & {
	settingsSchema?: TObject
	/**
	 * Import messages
	 */
	importMessages: (args: {
		settings: ProjectSettings & ExternalSettings
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<AST.MessageBundle[]>
}

export const Importer = Type.Object({
	id: Type.String({
		pattern: "^importer\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)$",
		examples: ["importer.namespace.id"],
	}) as unknown as TTemplateLiteral<[TLiteral<`importer.${string}.${string}`>]>,
	displayName: Translatable(Type.String()),
	description: Translatable(Type.String()),
	/**
	 * Tyepbox is must be used to validate the Json Schema.
	 * Github discussion to upvote a plain Json Schema validator and read the benefits of Typebox
	 * https://github.com/opral/monorepo/discussions/1503
	 */
	settingsSchema: Type.Optional(Type.Object({}, { additionalProperties: true })),
	importMessages: Type.Optional(Type.Any()),
})
