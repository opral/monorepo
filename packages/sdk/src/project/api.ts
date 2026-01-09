import type { Kysely } from "kysely";
import type { InlangDatabaseSchema } from "../database/schema.js";
import type { InlangPlugin } from "../plugin/schema.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import type { Lix } from "@lix-js/sdk";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export type InlangProject = {
	db: Kysely<InlangDatabaseSchema>;
	/**
	 * @deprecated Don't use this. Only an internal hack to unblock
	 * fink v2.
	 *
	 * TODO remove this
	 */
	_sqlite: SqliteWasmDatabase;
	id: {
		/**
		 * Stable for packed `.inlang` files. For unpacked projects loaded from a
		 * directory, the id is unstable because `project_id` is not persisted.
		 */
		get: () => Promise<string>;
	};
	plugins: {
		get: () => Promise<readonly InlangPlugin[]>;
	};
	errors: {
		get: () => Promise<readonly Error[]>;
	};
	settings: {
		get: () => Promise<ProjectSettings>;
		set: (settings: ProjectSettings) => Promise<void>;
	};
	lix: Lix;
	importFiles: (args: {
		pluginKey: InlangPlugin["key"];
		files: ImportFile[];
	}) => Promise<void>;
	exportFiles: (args: {
		pluginKey: InlangPlugin["key"];
	}) => Promise<ExportFile[]>;
	close: () => Promise<void>;
	toBlob: () => Promise<Blob>;
};

export type ImportFile = {
	/** The locale of the resource file */
	locale: string;
	/** The binary content of the resource */
	content: Uint8Array;
	/**
	 * The metadata of the file to be imported.
	 *
	 * Used to store additional information that is accessible in `importFiles` via `toBeImportedFilesMetadata`.
	 * https://github.com/opral/inlang-sdk/issues/218
	 */
	toBeImportedFilesMetadata?: Record<string, any>;
};

export type ExportFile = {
	/** The locale of the resource file */
	locale: string;
	/**
	 * The name of the file.
	 *
	 * @example
	 *   "en.json"
	 *   "common-de.json"
	 *
	 */
	name: string;
	/** The binary content of the resource */
	content: Uint8Array;
};

/**
 * Minimal RxJS compatible (generic) subscription type.
 */
export type Subscription<T> = (callback: (value: T) => void) => {
	unsubscribe: () => void;
};
