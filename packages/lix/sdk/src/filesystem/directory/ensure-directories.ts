import { executeSync } from "../../database/execute-sync.js";
import type { LixEngine } from "../../engine/boot.js";
import {
	normalizeDirectoryPath,
	normalizeFilePath,
	normalizePathSegment,
} from "../path.js";

export function getActiveVersionId(
	engine: Pick<LixEngine, "sqlite" | "db">
): string {
	const result = executeSync({
		engine,
		query: engine.db.selectFrom("active_version").select("version_id"),
	});
	const versionId = result[0]?.version_id;
	if (!versionId) {
		throw new Error("No active version present");
	}
	return versionId;
}

export function readDirectoryByPath(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	path: string;
}): { id: string; parent_id: string | null; path: string } | undefined {
	if (args.path === "/") {
		return undefined;
	}

	const segments = args.path.slice(1, -1).split("/");
	let parentId: string | null = null;
	let lastRow: { id: string; parent_id: string | null } | undefined;
	for (const segment of segments) {
		const result = args.engine.sqlite.exec({
			sql: `
				SELECT
					json_extract(snapshot_content, '$.id') AS id,
					json_extract(snapshot_content, '$.parent_id') AS parent_id
				FROM state_all
				WHERE schema_key = 'lix_directory_descriptor'
					AND version_id = ?
					AND json_extract(snapshot_content, '$.name') = ?
					AND ${parentId === null ? "json_extract(snapshot_content, '$.parent_id') IS NULL" : "json_extract(snapshot_content, '$.parent_id') = ?"}
				LIMIT 1;
			`,
			bind:
				parentId === null
					? [args.versionId, segment]
					: [args.versionId, segment, parentId],
			returnValue: "resultRows",
		}) as Array<Array<string>>;
		const row = result[0];
		if (!row) {
			return undefined;
		}
		lastRow = {
			id: row[0] as string,
			parent_id: (row[1] as string | null) ?? null,
		};
		parentId = lastRow.id;
	}

	if (!lastRow) {
		return undefined;
	}

	return { id: lastRow.id, parent_id: lastRow.parent_id, path: args.path };
}

function readDirectoryDescriptorById(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	directoryId: string;
}): { id: string; parent_id: string | null; name: string } | undefined {
	const rows = executeSync({
		engine: args.engine,
		query: args.engine.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_directory_descriptor")
			.where("version_id", "=", args.versionId)
			.where("entity_id", "=", args.directoryId)
			.select(["snapshot_content"]),
	});
	const raw = rows[0]?.snapshot_content as
		| { id: string; parent_id: string | null; name: string }
		| string
		| undefined;
	if (!raw) {
		return undefined;
	}
	const snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;
	return snapshot as { id: string; parent_id: string | null; name: string };
}

export function readDirectoryPathById(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	directoryId: string;
}): string | undefined {
	return composeDirectoryPath({
		engine: args.engine,
		versionId: args.versionId,
		directoryId: args.directoryId,
	});
}

export function assertNoFileAtPath(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	filePath: string;
}): void {
	const rows = executeSync({
		engine: args.engine,
		query: args.engine.db
			.selectFrom("file_all")
			.where("path", "=", args.filePath)
			.where("lixcol_version_id", "=", args.versionId)
			.select(["id"]),
	});
	if (rows.length > 0) {
		throw new Error(
			`Directory path collides with existing file path: ${args.filePath}`
		);
	}
}

export function assertNoDirectoryAtFilePath(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	filePath: string;
}): void {
	const directoryPath = `${args.filePath}/`;
	const rows = executeSync({
		engine: args.engine,
		query: args.engine.db
			.selectFrom("directory_all")
			.where("path", "=", directoryPath)
			.where("lixcol_version_id", "=", args.versionId)
			.select(["id"]),
	});
	if (rows.length > 0) {
		throw new Error(
			`File path collides with existing directory path: ${directoryPath}`
		);
	}
}

export function computeDirectoryPath(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	parentId: string | null;
	name: string;
}): string {
	const rawName = args.name?.trim();
	const name = normalizePathSegment(rawName ?? "");
	if (!name) {
		throw new Error("Directory name must be provided");
	}

	const parentPath = args.parentId
		? composeDirectoryPath({
				engine: args.engine,
				versionId: args.versionId,
				directoryId: args.parentId,
			})
		: "/";

	if (!parentPath) {
		throw new Error(`Parent directory does not exist for id ${args.parentId}`);
	}

	const candidatePath = normalizeDirectoryPath(`${parentPath}${name}/`);

	assertNoFileAtPath({
		engine: args.engine,
		versionId: args.versionId,
		filePath: candidatePath.slice(0, -1),
	});

	return candidatePath;
}

function listAncestorDirectories(filePath: string): string[] {
	const normalizedPath = normalizeFilePath(filePath);
	const segments = normalizedPath.split("/").filter(Boolean);
	segments.pop();
	const paths: string[] = [];
	let current = "";
	for (const segment of segments) {
		const normalizedSegment = normalizePathSegment(segment);
		current += `/${normalizedSegment}`;
		paths.push(`${current}/`.normalize("NFC"));
	}
	return paths;
}

export function ensureDirectoryAncestors(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
	versionId?: string;
	filePath: string;
}): void {
	const versionId = args.versionId ?? getActiveVersionId(args.engine);
	const directories = listAncestorDirectories(args.filePath);
	if (directories.length === 0) return;

	let parentId: string | null = null;
	for (const dirPath of directories) {
		const existing = readDirectoryByPath({
			engine: args.engine,
			versionId,
			path: dirPath,
		});
		if (existing) {
			parentId = existing.id;
			continue;
		}

		const name = normalizePathSegment(
			dirPath.slice(1, -1).split("/").pop() ?? ""
		);
		const result = args.engine.sqlite.exec({
			sql: `SELECT handle_directory_upsert(NULL, ?, ?, ?, 0, ?);`,
			bind: [parentId, name, dirPath, versionId],
			returnValue: "resultRows",
		}) as Array<Array<string>>;
		const insertedId = result[0]?.[0] as string | undefined;
		if (typeof insertedId !== "string") {
			throw new Error(`Failed to create directory for path ${dirPath}`);
		}
		parentId = insertedId;
	}
}

export function ensureDirectoryPathExists(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
	versionId: string;
	path: string;
}): string | null {
	if (args.path === "/") {
		return null;
	}

	const normalizedPath = normalizeDirectoryPath(args.path);
	const segments = normalizedPath.slice(1, -1).split("/");
	let parentId: string | null = null;
	let currentPath = "";

	for (const segment of segments) {
		const normalizedSegment = normalizePathSegment(segment);
		currentPath += `/${normalizedSegment}`;
		const fullPath = normalizeDirectoryPath(`${currentPath}/`);
		const existing = readDirectoryByPath({
			engine: args.engine,
			versionId: args.versionId,
			path: fullPath,
		});
		if (existing) {
			parentId = existing.id;
			continue;
		}

		const result = args.engine.sqlite.exec({
			sql: `SELECT handle_directory_upsert(NULL, ?, ?, NULL, 0, ?);`,
			bind: [parentId, normalizedSegment, args.versionId],
			returnValue: "resultRows",
		}) as Array<Array<string>>;
		const insertedId = result[0]?.[0] as string | undefined;
		if (typeof insertedId !== "string") {
			throw new Error(`Failed to create directory for path ${fullPath}`);
		}
		parentId = insertedId;
	}

	return parentId;
}

export function composeDirectoryPath(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	directoryId: string | null;
}): string | undefined {
	if (args.directoryId === null) {
		return "/";
	}

	const segments: string[] = [];
	let currentId: string | null = args.directoryId;
	let safety = 0;
	while (currentId) {
		if (safety++ > 1024) {
			throw new Error("Directory hierarchy appears to be cyclic");
		}
		const descriptor = readDirectoryDescriptorById({
			engine: args.engine,
			versionId: args.versionId,
			directoryId: currentId,
		});
		if (!descriptor) {
			return undefined;
		}
		segments.push(descriptor.name);
		currentId = descriptor.parent_id ?? null;
	}

	if (segments.length === 0) {
		return "/";
	}

	return `/${segments.reverse().join("/")}/`.normalize("NFC");
}
