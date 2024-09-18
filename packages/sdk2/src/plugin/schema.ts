import type { TObject } from "@sinclair/typebox";
import type { MessageV1 } from "../json-schema/old-v1-message/schemaV1.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import type { ResourceFile } from "../project/api.js";
import type { BundleNested, NewBundleNested } from "../database/schema.js";

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
	 * Import / Export files.
	 * see https://linear.app/opral/issue/MESDK-157/sdk-v2-release-on-sqlite
	 */
	toBeImportedFiles?: (args: {
		settings: ProjectSettings & ExternalSettings;
		nodeFs: NodeFsPromisesSubset;
	}) => MaybePromise<Array<Pick<ResourceFile, "path" | "locale">>>;
	importFiles?: (args: {
		files: Array<Omit<ResourceFile, "pluginKey">>;
		settings: ProjectSettings & ExternalSettings; // we expose the settings in case the importFunction needs to access the plugin config
	}) => MaybePromise<{
		bundles: NewBundleNested[];
	}>;
	exportFiles?: (args: {
		bundles: BundleNested[];
		settings: ProjectSettings & ExternalSettings;
	}) => MaybePromise<Array<Omit<ResourceFile, "pluginKey">>>;
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

/**
 * Exposing only a subset to ease mapping of fs functions.
 *
 * https://github.com/opral/inlang-sdk/issues/136
 */
export type NodeFsPromisesSubset = {
	readFile: (path: string) => Promise<ArrayBuffer>;
	readdir: (path: string) => Promise<string[]>;
};

type MaybePromise<T> = T | Promise<T>;