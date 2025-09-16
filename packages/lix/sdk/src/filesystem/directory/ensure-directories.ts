import { executeSync } from "../../database/execute-sync.js";
import type { LixEngine } from "../../engine/boot.js";
import { isValidDirectoryPath } from "../path.js";

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
	const rows = executeSync({
		engine: args.engine,
		query: args.engine.db
			.selectFrom("directory_all")
			.where("path", "=", args.path)
			.where("lixcol_version_id", "=", args.versionId)
			.select(["id", "parent_id", "path"]),
	});
	return rows[0] as any;
}

export function readDirectoryPathById(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	directoryId: string;
}): string | undefined {
	const rows = executeSync({
		engine: args.engine,
		query: args.engine.db
			.selectFrom("directory_all")
			.where("id", "=", args.directoryId)
			.where("lixcol_version_id", "=", args.versionId)
			.select(["path"]),
	});
	return rows[0]?.path as string | undefined;
}

function assertNoFileAtPath(args: {
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
	const name = args.name?.trim();
	if (!name) {
		throw new Error("Directory name must be provided");
	}

	let basePath: string;
	if (!args.parentId) {
		basePath = "/";
	} else {
		const parentPath = readDirectoryPathById({
			engine: args.engine,
			versionId: args.versionId,
			directoryId: args.parentId,
		});
		if (!parentPath) {
			throw new Error(
				`Parent directory does not exist for id ${args.parentId}`
			);
		}
		basePath = parentPath;
	}

	const candidatePath = `${basePath}${name}/`;
	if (!isValidDirectoryPath(candidatePath)) {
		throw new Error(`Invalid directory path ${candidatePath}`);
	}

	assertNoFileAtPath({
		engine: args.engine,
		versionId: args.versionId,
		filePath: candidatePath.slice(0, -1),
	});

	return candidatePath;
}

function listAncestorDirectories(filePath: string): string[] {
	const segments = filePath.split("/").filter(Boolean);
	segments.pop();
	const paths: string[] = [];
	let current = "";
	for (const segment of segments) {
		current += `/${segment}`;
		paths.push(`${current}/`);
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

		const name = dirPath.slice(1, -1).split("/").pop() ?? "";
		const result = args.engine.sqlite.exec({
			sql: `SELECT handle_directory_upsert(NULL, ?, ?, NULL, 0, ?);`,
			bind: [parentId, name, versionId],
			returnValue: "resultRows",
		}) as Array<Array<string>>;
		const insertedId = result[0]?.[0] as string | undefined;
		if (typeof insertedId !== "string") {
			throw new Error(`Failed to create directory for path ${dirPath}`);
		}
		parentId = insertedId;
	}
}
