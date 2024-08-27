import type { Kysely } from "kysely";
import type {
	InlangDatabaseSchema,
	NewBundleNested,
} from "../database/schema.js";
import type { InlangPlugin } from "../plugin/schema.js";
import type { ProjectSettings } from "../schema/settings.js";
import type { Lix } from "@lix-js/sdk";
import type { SqliteDatabase } from "sqlite-wasm-kysely";

export type InlangProject = {
	db: Kysely<InlangDatabaseSchema>;
	/**
	 * @deprecated Don't use this. Only an internal hack to unblock
	 * fink v2.
	 *
	 * TODO remove this
	 */
	_sqlite: SqliteDatabase;
	plugins: {
		get: () => readonly InlangPlugin[];
		subscribe: Subscription<readonly InlangPlugin[]>;
	};
	errors: {
		get: () => readonly Error[];
		subscribe: Subscription<readonly Error[]>;
	};
	settings: {
		get: () => ProjectSettings;
		set: (settings: ProjectSettings) => Promise<void>;
		subscribe: Subscription<ProjectSettings>;
	};
	settled: () => Promise<void>;
	lix: Lix;
	importFiles: (args: {
		pluginKey: InlangPlugin["key"];
		files: ResourceFile[];
	}) => Promise<NewBundleNested[]>;
	exportFiles: (args: {
		pluginKey: InlangPlugin["key"];
	}) => Promise<ResourceFile[]>;
	close: () => Promise<void>;
	toBlob: () => Promise<Blob>;
};

export type ResourceFile = {
	/** The absolute filepath of the resource */
	path: string;
	/** The binary content of the resource */
	content: ArrayBuffer;
	/** The plugin which loaded this resource */
	pluginKey: InlangPlugin["key"];
};

/**
 * Minimal RxJS compatible (generic) subscription type.
 */
export type Subscription<T> = (callback: (value: T) => void) => {
	unsubscribe: () => void;
};
