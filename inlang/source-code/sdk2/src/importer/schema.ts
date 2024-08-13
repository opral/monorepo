import type { TObject } from "@sinclair/typebox";
import type { BundleNested } from "../schema/schemaV2.js";
import type { MessageV1 } from "../schema/schemaV1.js";
import type { ProjectSettings } from "../schema/settings.js";
// eslint-disable-next-line no-restricted-imports
import type fs from "node:fs/promises";
import type { ResourceFile } from "../project/api.js";

export type InlangPlugin = {
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
		nodeishFs: Pick<typeof fs, "readFile" | "readdir" | "mkdir" | "writeFile">;
	}) => Promise<MessageV1[]> | MessageV1[];
	/**
	 * @deprecated Use `exportFiles` instead.
	 */
	saveMessages?: (args: {
		messages: MessageV1[];
		settings: ProjectSettings;
		nodeishFs: Pick<typeof fs, "readFile" | "readdir" | "mkdir" | "writeFile">;
	}) => Promise<void> | void;
	/**
	 * Import / Export files.
	 * see https://linear.app/opral/issue/MESDK-157/sdk-v2-release-on-sqlite
	 */
	toBeImportedFiles?: (args: {
		settings: ProjectSettings;
		nodeFs: typeof fs;
	}) => Promise<Array<ResourceFile>> | Array<ResourceFile>;
	importFiles?: (args: { files: Array<ResourceFile> }) => {
		bundles: BundleNested;
	};
	exportFiles?: (args: {
		bundles: BundleNested;
		settings: ProjectSettings;
	}) => Array<ResourceFile>;
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
	addCustomApi?: (args: {
		settings: ProjectSettings;
	}) => Record<string, unknown>;
};
