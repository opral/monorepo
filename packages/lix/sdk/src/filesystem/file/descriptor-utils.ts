import type { LixEngine } from "../../engine/boot.js";
import {
	composeFileName,
	composeFilePath as composeFullFilePath,
	splitFilePath,
	normalizeFilePath,
} from "../path.js";
import type { LixFile } from "./schema.js";
import {
	composeDirectoryPath,
	readDirectoryByPath,
} from "../directory/ensure-directories.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";

export type FileDescriptorFields = {
	directoryId: string | null;
	name: string;
	extension: string | null;
	metadata: unknown;
	hidden: boolean;
};

export function deriveDescriptorFieldsFromPath(args: {
	engine: Pick<LixEngine, "executeSync">;
	versionId: string;
	path: string;
	metadata: unknown;
	hidden: boolean;
}): FileDescriptorFields {
	const normalizedPath = normalizeFilePath(args.path);
	const { directoryPath, name, extension } = splitFilePath(normalizedPath);

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
	};
}

export function readFileDescriptorSnapshot(args: {
	engine: Pick<LixEngine, "executeSync">;
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
	  }
	| undefined {
	const rows = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_file_descriptor")
			.where("version_id", "=", args.versionId)
			.where("entity_id", "=", args.fileId)
			.select(["snapshot_content"])
			.compile()
	).rows;
	const raw = rows[0]?.snapshot_content as
		| {
				id: string;
				directory_id: string | null;
				name: string;
				extension: string | null;
				metadata?: unknown;
				hidden?: boolean;
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
	};
}

export function composeFilePathFromDescriptor(args: {
	engine: Pick<LixEngine, "executeSync">;
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

function readDirectoryHistoryLeafAtDepth(args: {
	engine: Pick<LixEngine, "executeSync">;
	directoryId: string;
	rootCommitId: string;
	depth: number;
}): { id: string; parent_id: string | null; name: string } | undefined {
	const rows = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("state_history as sh1")
			.select(["sh1.snapshot_content"])
			.where("sh1.schema_key", "=", "lix_directory_descriptor")
			.where("sh1.entity_id", "=", args.directoryId)
			.where("sh1.root_commit_id", "=", args.rootCommitId)
			.where("sh1.depth", "=", (eb: any) =>
				eb
					.selectFrom("state_history as sh2")
					.select("sh2.depth")
					.where("sh2.schema_key", "=", "lix_directory_descriptor")
					.where("sh2.entity_id", "=", args.directoryId)
					.where("sh2.root_commit_id", "=", args.rootCommitId)
					.where("sh2.depth", ">=", args.depth)
					.orderBy("sh2.depth")
					.limit(1)
			)
			.compile()
	).rows;
	const raw = rows[0]?.snapshot_content as
		| { id: string; parent_id: string | null; name: string }
		| string
		| undefined;
	if (!raw) {
		return undefined;
	}
	const snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;
	return {
		id: snapshot.id,
		parent_id: snapshot.parent_id ?? null,
		name: snapshot.name,
	};
}

export function composeDirectoryPathAtCommit(args: {
	engine: Pick<LixEngine, "executeSync">;
	directoryId: string | null;
	rootCommitId: string;
	depth: number;
}): string | undefined {
	if (args.directoryId === null) {
		return "/";
	}

	const seen = new Set<string>();
	let current: string | null = args.directoryId;
	const segments: string[] = [];

	while (current) {
		if (seen.has(current)) {
			throw new Error(
				`Directory cycle detected when composing path at commit ${args.rootCommitId}`
			);
		}
		seen.add(current);
		const snapshot = readDirectoryHistoryLeafAtDepth({
			engine: args.engine,
			directoryId: current,
			rootCommitId: args.rootCommitId,
			depth: args.depth,
		});
		if (!snapshot) {
			return undefined;
		}
		segments.push(snapshot.name);
		current = snapshot.parent_id;
	}

	return `/${segments.reverse().join("/")}/`;
}

export function composeFilePathAtCommit(args: {
	engine: Pick<LixEngine, "executeSync">;
	directoryId: string | null;
	name: string;
	extension: string | null;
	rootCommitId: string;
	depth: number;
}): string | undefined {
	const directoryPath = composeDirectoryPathAtCommit({
		engine: args.engine,
		directoryId: args.directoryId,
		rootCommitId: args.rootCommitId,
		depth: args.depth,
	});
	if (directoryPath === undefined) {
		return undefined;
	}
	const fileName = composeFileNameFromFields({
		name: args.name,
		extension: args.extension ?? null,
	});
	if (directoryPath === "/") {
		return `/${fileName}`;
	}
	return `${directoryPath.slice(0, -1)}/${fileName}`;
}

export function readFileDescriptorAtCommit(args: {
	engine: Pick<LixEngine, "executeSync">;
	fileId: string;
	rootCommitId: string;
	depth: number;
}):
	| {
			id: string;
			directory_id: string | null;
			name: string;
			extension: string | null;
			metadata: unknown;
			hidden: boolean;
	  }
	| undefined {
	const rows = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("state_history")
			.where("schema_key", "=", "lix_file_descriptor")
			.where("entity_id", "=", args.fileId)
			.where("root_commit_id", "=", args.rootCommitId)
			.where("depth", "=", args.depth)
			.select(["snapshot_content"])
			.compile()
	).rows;
	const raw = rows[0]?.snapshot_content as
		| {
				id: string;
				directory_id: string | null;
				name: string;
				extension: string | null;
				metadata?: unknown;
				hidden?: boolean;
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
	};
}

export function ensureCompleteDescriptor(args: {
	engine: Pick<LixEngine, "executeSync">;
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
	const computedPath = directoryPath
		? composeFullFilePath({
				directoryPath,
				name: snapshot.name,
				extension: snapshot.extension ?? null,
			})
		: args.file.path;

	return {
		id: snapshot.id,
		path: computedPath,
		directory_id: snapshot.directory_id,
		name: snapshot.name,
		extension: snapshot.extension,
		metadata: args.file.metadata ?? snapshot.metadata ?? null,
		hidden: snapshot.hidden,
	};
}
