import type { TObject } from "@sinclair/typebox";
import type { MessageV1 } from "../json-schema/old-v1-message/schemaV1.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import type { BundleNested, NewBundleNested } from "../database/schema.js";
import type { ExportFile } from "../project/api.js";

export type InlangPlugin<
	ExternalSettings extends Record<string, any> | unknown = unknown
> = {
	/**
	 * @deprecated Use `key` instead.
	 */
	id?: string;
	/**
	 * The key of the plugin.
	 */
	key: string;
	settingsSchema?: TObject;
	/**
	 * @deprecated Use `importFiles` instead.
	 */
	loadMessages?: (args: {
		settings: ProjectSettings;
		nodeishFs: NodeFsPromisesSubsetLegacy;
	}) => Promise<MessageV1[]> | MessageV1[];
	/**
	 * @deprecated Use `exportFiles` instead.
	 */
	saveMessages?: (args: {
		messages: MessageV1[];
		settings: ProjectSettings;
		nodeishFs: NodeFsPromisesSubsetLegacy;
	}) => Promise<void> | void;
	/**
	 * Files that should be imported by the inlang SDK.
	 *
	 * - `metadata` is optional and can be used to store additional information
	 *   that is accessible in `importFiles` via `toBeImportedMetadata`. See
	 *   https://github.com/opral/inlang-sdk/issues/218 for more info.
	 *
	 */
	toBeImportedFiles?: (args: {
		settings: ProjectSettings & ExternalSettings;
	}) => MaybePromise<
		Array<{ path: string; locale: string; metadata?: Record<string, any> }>
	>;
	importFiles?: (args: {
		files: Array<{
			locale: string;
			content: ArrayBuffer;
			toBeImportedFilesMetadata?: Record<string, any>;
		}>;
		settings: ProjectSettings & ExternalSettings; // we expose the settings in case the importFunction needs to access the plugin config
	}) => MaybePromise<{
		bundles: NewBundleNested[];
	}>;
	exportFiles?: (args: {
		bundles: BundleNested[];
		settings: ProjectSettings & ExternalSettings;
	}) => MaybePromise<Array<ExportFile>>;
	/**
	 * @deprecated Use the `meta` field instead.
	 */
	addCustomApi?: (args: {
		settings: ProjectSettings & ExternalSettings;
	}) => Record<string, unknown>;
	/**
	 * Define app-specific APIs under a `meta` field.
	 *
	 * @example
	 * meta: {
	 *   "app.inlang.ide-extension": {
	 *     documentPaths: ["*.json"]
	 *   }
	 * }
	 */
	meta?: Record<string, Record<string, unknown>>;
};

/**
 * Exposing only a subset to ease mapping of fs functions.
 *
 * https://github.com/opral/inlang-sdk/issues/136
 */
export type NodeFsPromisesSubsetLegacy = {
	readFile:
		| ((path: string) => Promise<ArrayBuffer>)
		| ((path: string, options?: { encoding: "utf-8" }) => Promise<string>);
	readdir: (path: string) => Promise<string[]>;
	writeFile: (path: string, data: ArrayBuffer | string) => Promise<void>;
	mkdir: (path: string) => Promise<void>;
};


type MaybePromise<T> = T | Promise<T>;