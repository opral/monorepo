import { executeSync } from "../../database/execute-sync.js";
import type { LixEngine } from "../../engine/boot.js";
import {
	composeFileName,
	composeFilePath as composeFullFilePath,
	splitFilePath,
} from "../path.js";
import type { LixFile } from "./schema.js";
import {
	composeDirectoryPath,
	readDirectoryByPath,
} from "../directory/ensure-directories.js";

export type FileDescriptorFields = {
	directoryId: string | null;
	name: string;
	extension: string | null;
	metadata: unknown;
	hidden: boolean;
	path: string;
};

export function deriveDescriptorFieldsFromPath(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	path: string;
	metadata: unknown;
	hidden: boolean;
}): FileDescriptorFields {
	const { directoryPath, name, extension } = splitFilePath(args.path);

	let directoryId: string | null = null;
	if (directoryPath) {
		const directory = readDirectoryByPath({
			engine: args.engine,
			versionId: args.versionId,
			path: directoryPath,
		});
		if (!directory) {
			throw new Error(`Directory descriptor missing for ${directoryPath}`);
		}
		directoryId = directory.id;
	}

	return {
		directoryId,
		name,
		extension,
		metadata: args.metadata ?? null,
		hidden: Boolean(args.hidden),
		path: args.path,
	};
}


export function readFileDescriptorSnapshot(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	fileId: string;
}):
	| {
			id: string;
			directory_id: string | null;
			name: string;
			extension: string | null;
			metadata: unknown;
			hidden: boolean;
			path: string | null;
	  }
	| undefined {
	const rows = executeSync({
		engine: args.engine,
		query: args.engine.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_file_descriptor")
			.where("version_id", "=", args.versionId)
			.where("entity_id", "=", args.fileId)
			.select(["snapshot_content"]),
	});
	const raw = rows[0]?.snapshot_content as
		| {
				id: string;
				directory_id: string | null;
				name: string;
				extension: string | null;
				metadata?: unknown;
				hidden?: boolean;
				path?: string | null;
			}
		| string
		| undefined;
	if (!raw) {
		return undefined;
	}
	const snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;

	return {
		id: snapshot.id,
		directory_id: snapshot.directory_id ?? null,
		name: snapshot.name,
		extension: snapshot.extension ?? null,
		metadata: snapshot.metadata ?? null,
		hidden: Boolean(snapshot.hidden),
		path: snapshot.path ?? null,
	};
}

export function composeFilePathFromDescriptor(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	fileId: string;
}): string | undefined {
	const descriptor = readFileDescriptorSnapshot(args);
	if (!descriptor) {
		return undefined;
	}

	const directoryPath = composeDirectoryPath({
		engine: args.engine,
		versionId: args.versionId,
		directoryId: descriptor.directory_id ?? null,
	});
	if (!directoryPath) {
		return undefined;
	}

	return composeFullFilePath({
		directoryPath,
		name: descriptor.name,
		extension: descriptor.extension ?? null,
	});
}

export function composeFileNameFromFields(args: {
	name: string;
	extension: string | null;
}): string {
	return composeFileName(args.name, args.extension ?? null);
}

export function ensureCompleteDescriptor(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	file: Pick<LixFile, "id" | "path"> &
		Partial<Omit<LixFile, "id" | "path" | "data">>;
}): Omit<LixFile, "data"> {
	if (
		args.file.directory_id !== undefined &&
		args.file.name !== undefined &&
		args.file.extension !== undefined &&
		args.file.hidden !== undefined
	) {
		return {
			id: args.file.id,
			path: args.file.path,
			directory_id: args.file.directory_id,
			name: args.file.name,
			extension: args.file.extension,
			metadata: args.file.metadata ?? null,
			hidden: args.file.hidden,
		};
	}

	const snapshot = readFileDescriptorSnapshot({
		engine: args.engine,
		versionId: args.versionId,
		fileId: args.file.id,
	});
	if (!snapshot) {
		throw new Error(
			`File descriptor missing for ${args.file.id} in version ${args.versionId}`
		);
	}

	const directoryPath = composeDirectoryPath({
		engine: args.engine,
		versionId: args.versionId,
		directoryId: snapshot.directory_id ?? null,
	});

	return {
		id: snapshot.id,
		path:
			snapshot.path ??
			(directoryPath
				? composeFullFilePath({
						directoryPath,
						name: snapshot.name,
						extension: snapshot.extension ?? null,
				  })
				: args.file.path) ?? args.file.path,
		directory_id: snapshot.directory_id,
		name: snapshot.name,
		extension: snapshot.extension,
		metadata: (args.file.metadata ?? snapshot.metadata) ?? null,
		hidden: snapshot.hidden,
	};
}
