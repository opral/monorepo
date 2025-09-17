import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../../schema-definition/definition.js";
import type { LixEngine } from "../../engine/boot.js";
import { normalizeDirectoryPath, normalizePathSegment } from "../path.js";
import { nanoIdSync } from "../../engine/deterministic/nano-id.js";
import {
	getActiveVersionId,
	readDirectoryByPath,
	composeDirectoryPath,
	assertNoFileAtPath,
	ensureDirectoryPathExists,
	computeDirectoryPath,
} from "./ensure-directories.js";
import { executeSync } from "../../database/execute-sync.js";

export const LixDirectoryDescriptorSchema = {
	"x-lix-key": "lix_directory_descriptor",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-unique": [["parent_id", "name"]],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		parent_id: {
			type: "string",
			nullable: true,
			description:
				"Identifier of the parent directory. Null indicates the virtual root directory.",
		},
		name: {
			type: "string",
			pattern: "^[^/\\\\]+$",
			description: "Directory segment without slashes.",
		},
		hidden: { type: "boolean", "x-lix-generated": true },
	},
	required: ["id", "parent_id", "name"],
	additionalProperties: false,
} as const;
LixDirectoryDescriptorSchema satisfies LixSchemaDefinition;

/**
 * Directory descriptor stored in the database.
 *
 * @example
 * const dir: LixDirectoryDescriptor = {
 *   id: "dir_123",
 *   parent_id: null,
 *   name: "docs",
 *   hidden: false
 * };
 */
export type LixDirectoryDescriptor = FromLixSchemaDefinition<
	typeof LixDirectoryDescriptorSchema
>;

/**
 * Installs directory descriptors into the database via generated views/triggers.
 *
 * @example
 * applyDirectoryDatabaseSchema({ engine });
 */
export function applyDirectoryDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): void {
	const { engine } = args;
	const schemaKey = LixDirectoryDescriptorSchema["x-lix-key"];
	const schemaVersion = LixDirectoryDescriptorSchema["x-lix-version"];
	const fileId = "lix_directory_descriptor";
	const pluginKey = "lix_own_entity";

	const upsertDirectory = ({
		idArg,
		parentIdArg,
		nameArg,
		pathArg,
		hiddenArg,
		versionIdArg,
	}: {
		idArg: unknown;
		parentIdArg: unknown;
		nameArg: unknown;
		pathArg: unknown;
		hiddenArg: unknown;
		versionIdArg: unknown;
	}): string => {
		const versionId = versionIdArg
			? String(versionIdArg)
			: getActiveVersionId(engine);

		const { parentId, name, computedPath } = computeUpsertInputs({
			engine,
			versionId,
			parentIdArg,
			nameArg,
			pathArg,
		});

		const existing = readDirectoryByPath({
			engine,
			versionId,
			path: computedPath,
		});

		let id = idArg ? String(idArg) : existing?.id;
		if (!id) {
			id = nanoIdSync({ engine });
		}

		if (existing && existing.id !== id) {
			throw new Error(`Directory already exists at ${computedPath}`);
		}

		assertNoDirectoryCycle({
			engine,
			versionId,
			directoryId: id,
			newParentId: parentId,
		});

		const hidden = hiddenArg ? Number(hiddenArg) : 0;

		executeSync({
			engine,
			query: engine.db
				.deleteFrom("state_all")
				.where("entity_id", "=", id)
				.where("schema_key", "=", schemaKey)
				.where("version_id", "=", versionId),
		});

		executeSync({
			engine,
			query: engine.db.insertInto("state_all").values({
				entity_id: id,
				schema_key: schemaKey,
				file_id: fileId,
				plugin_key: pluginKey,
				snapshot_content: {
					id,
					parent_id: parentId,
					name,
					hidden: Boolean(hidden),
				},
				schema_version: schemaVersion,
				version_id: versionId,
				untracked: false,
			}),
		});

		return id;
	};

	engine.sqlite.createFunction({
		name: "handle_directory_upsert",
		arity: 6,
		deterministic: false,
		xFunc: (_ctx: number, ...fnArgs: any[]) => {
			const [idArg, parentIdArg, nameArg, pathArg, hiddenArg, versionIdArg] =
				fnArgs;
			return upsertDirectory({
				idArg,
				parentIdArg,
				nameArg,
				pathArg,
				hiddenArg,
				versionIdArg,
			});
		},
	});

	engine.sqlite.createFunction({
		name: "compose_directory_path",
		arity: 2,
		deterministic: false,
		xFunc: (_ctx: number, ...fnArgs: any[]) => {
			const directoryId = fnArgs[0] as string | null;
			const versionId = String(fnArgs[1]);
			return (
				composeDirectoryPath({
					engine,
					versionId,
					directoryId,
				}) ?? null
			);
		},
	});

	engine.sqlite.exec(`
		CREATE VIEW IF NOT EXISTS directory_all AS
		SELECT
			json_extract(snapshot_content, '$.id') AS id,
			json_extract(snapshot_content, '$.parent_id') AS parent_id,
			json_extract(snapshot_content, '$.name') AS name,
			compose_directory_path(json_extract(snapshot_content, '$.id'), version_id) AS path,
			json_extract(snapshot_content, '$.hidden') AS hidden,
			entity_id AS lixcol_entity_id,
			'${schemaKey}' AS lixcol_schema_key,
			entity_id AS lixcol_directory_id,
			version_id AS lixcol_version_id,
			inherited_from_version_id AS lixcol_inherited_from_version_id,
			change_id AS lixcol_change_id,
			created_at AS lixcol_created_at,
			updated_at AS lixcol_updated_at,
			commit_id AS lixcol_commit_id,
			untracked AS lixcol_untracked
		FROM state_all
		WHERE schema_key = '${schemaKey}';

		CREATE VIEW IF NOT EXISTS directory AS
		SELECT * FROM directory_all
		WHERE lixcol_version_id IN (SELECT version_id FROM active_version);

		CREATE VIEW IF NOT EXISTS directory_history AS
		SELECT
			json_extract(snapshot_content, '$.id') AS id,
			json_extract(snapshot_content, '$.parent_id') AS parent_id,
			json_extract(snapshot_content, '$.name') AS name,
			compose_directory_path(json_extract(snapshot_content, '$.id'), version_id) AS path,
			json_extract(snapshot_content, '$.hidden') AS hidden,
			entity_id AS lixcol_entity_id,
			'${schemaKey}' AS lixcol_schema_key,
			file_id AS lixcol_file_id,
			plugin_key AS lixcol_plugin_key,
			schema_version AS lixcol_schema_version,
			change_id AS lixcol_change_id,
			commit_id AS lixcol_commit_id,
			root_commit_id AS lixcol_root_commit_id,
			depth AS lixcol_depth
		FROM state_history
		WHERE schema_key = '${schemaKey}';
	`);

	engine.sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS directory_insert
		INSTEAD OF INSERT ON directory
		BEGIN
			SELECT handle_directory_upsert(
				COALESCE(NEW.id, lix_nano_id()),
				NEW.parent_id,
				NEW.name,
				NEW.path,
				COALESCE(NEW.hidden, 0),
				(SELECT version_id FROM active_version)
			);
		END;
	`);

	engine.sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS directory_update
		INSTEAD OF UPDATE ON directory
		BEGIN
			SELECT handle_directory_upsert(
				NEW.id,
				NEW.parent_id,
				NEW.name,
				CASE WHEN NEW.path = OLD.path THEN NULL ELSE NEW.path END,
				COALESCE(NEW.hidden, OLD.hidden),
				(SELECT version_id FROM active_version)
			);
		END;
	`);

	engine.sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS directory_delete
		INSTEAD OF DELETE ON directory
		BEGIN
			DELETE FROM file
			WHERE path = substr(OLD.path, 1, length(OLD.path) - 1)
				OR (
					path >= substr(OLD.path, 1, length(OLD.path) - 1) || '/'
					AND path < substr(OLD.path, 1, length(OLD.path) - 1) || '0'
				);

			DELETE FROM state_all
			WHERE schema_key = '${schemaKey}'
				AND version_id = (SELECT version_id FROM active_version)
				AND entity_id IN (
					WITH RECURSIVE to_delete(id) AS (
						SELECT OLD.id
						UNION ALL
						SELECT json_extract(child.snapshot_content, '$.id')
						FROM state_all child
						JOIN to_delete parent
							ON json_extract(child.snapshot_content, '$.parent_id') = parent.id
						WHERE child.schema_key = '${schemaKey}'
							AND child.version_id = (SELECT version_id FROM active_version)
					)
					SELECT id FROM to_delete
				);
		END;
	`);

	engine.sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS directory_all_insert
		INSTEAD OF INSERT ON directory_all
		BEGIN
			SELECT handle_directory_upsert(
				COALESCE(NEW.id, lix_nano_id()),
				NEW.parent_id,
				NEW.name,
				NEW.path,
				COALESCE(NEW.hidden, 0),
				COALESCE(NEW.lixcol_version_id, (SELECT version_id FROM active_version))
			);
		END;
	`);

	engine.sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS directory_all_update
		INSTEAD OF UPDATE ON directory_all
		BEGIN
			SELECT handle_directory_upsert(
				NEW.id,
				NEW.parent_id,
				NEW.name,
				CASE WHEN NEW.path = OLD.path THEN NULL ELSE NEW.path END,
				COALESCE(NEW.hidden, OLD.hidden),
				COALESCE(NEW.lixcol_version_id, OLD.lixcol_version_id)
			);
		END;
	`);

	engine.sqlite.exec(`
		CREATE TRIGGER IF NOT EXISTS directory_all_delete
		INSTEAD OF DELETE ON directory_all
		BEGIN
			DELETE FROM file_all
			WHERE (
				path = substr(OLD.path, 1, length(OLD.path) - 1)
				OR (
					path >= substr(OLD.path, 1, length(OLD.path) - 1) || '/'
					AND path < substr(OLD.path, 1, length(OLD.path) - 1) || '0'
				)
			)
				AND lixcol_version_id = OLD.lixcol_version_id;

			DELETE FROM state_all
			WHERE schema_key = '${schemaKey}'
				AND version_id = OLD.lixcol_version_id
				AND entity_id IN (
					WITH RECURSIVE to_delete(id) AS (
						SELECT OLD.id
						UNION ALL
						SELECT json_extract(child.snapshot_content, '$.id')
						FROM state_all child
						JOIN to_delete parent
							ON json_extract(child.snapshot_content, '$.parent_id') = parent.id
						WHERE child.schema_key = '${schemaKey}'
							AND child.version_id = OLD.lixcol_version_id
					)
					SELECT id FROM to_delete
				);
		END;
	`);

	// internal_state_vtable is a virtual table; adding SQLite indexes would fail. Historical
	// performance improvements for directories can be handled within the change/history tables
	// if needed.
}

function computeUpsertInputs(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
	versionId: string;
	parentIdArg: unknown;
	nameArg: unknown;
	pathArg: unknown;
}): { parentId: string | null; name: string; computedPath: string } {
	let parentId: string | null = null;
	let name = "";

	const rawParentId =
		args.parentIdArg === null ||
		args.parentIdArg === undefined ||
		args.parentIdArg === ""
			? null
			: String(args.parentIdArg);

	let computedPath: string;
	if (typeof args.pathArg === "string" && args.pathArg.trim() !== "") {
		const normalizedPath = normalizeDirectoryPath(args.pathArg.trim());
		const segments = normalizedPath.slice(1, -1).split("/");
		name = normalizePathSegment(segments.pop() ?? "");
		if (!name) {
			throw new Error("Directory name must be provided");
		}
		if (name === "." || name === "..") {
			throw new Error("Directory name cannot be '.' or '..'");
		}
		const parentPath =
			segments.length === 0
				? null
				: normalizeDirectoryPath(`/${segments.join("/")}/`);
		if (parentPath) {
			parentId = ensureDirectoryPathExists({
				engine: args.engine,
				versionId: args.versionId,
				path: parentPath,
			});
		} else {
			parentId = null;
		}
		if (rawParentId && parentId && rawParentId !== parentId) {
			throw new Error(
				`Provided parent_id ${rawParentId} does not match parent derived from path ${normalizedPath}`
			);
		}
		if (rawParentId && !parentId) {
			throw new Error("Provided parent_id does not match root directory");
		}
		computedPath = normalizeDirectoryPath(
			computeDirectoryPath({
				engine: args.engine,
				versionId: args.versionId,
				parentId,
				name,
			})
		);
		if (computedPath !== normalizedPath) {
			throw new Error(
				`Provided directory path '${normalizedPath}' does not match normalized path '${computedPath}'`
			);
		}
	} else {
		parentId = rawParentId;
		name = normalizePathSegment(String(args.nameArg ?? "").trim());
		if (!name) {
			throw new Error("Directory name must be provided");
		}
		if (name === "." || name === "..") {
			throw new Error("Directory name cannot be '.' or '..'");
		}
		const parentPath = parentId
			? composeDirectoryPath({
					engine: args.engine,
					versionId: args.versionId,
					directoryId: parentId,
				})
			: "/";
		if (!parentPath) {
			throw new Error(`Parent directory does not exist for id ${parentId}`);
		}
		computedPath = normalizeDirectoryPath(
			computeDirectoryPath({
				engine: args.engine,
				versionId: args.versionId,
				parentId,
				name,
			})
		);
	}

	assertNoFileAtPath({
		engine: args.engine,
		versionId: args.versionId,
		filePath: computedPath.slice(0, -1),
	});

	return { parentId, name, computedPath };
}

function assertNoDirectoryCycle(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	versionId: string;
	directoryId: string;
	newParentId: string | null;
}): void {
	if (!args.newParentId) {
		return;
	}

	if (args.newParentId === args.directoryId) {
		throw new Error("Directory cannot be its own parent");
	}
	let current: string | null = args.newParentId;
	let safety = 0;
	while (current) {
		if (current === args.directoryId) {
			throw new Error("Directory parent would create a cycle");
		}
		if (safety++ > 1024) {
			throw new Error("Directory hierarchy appears to be cyclic");
		}
		const rows = executeSync({
			engine: args.engine,
			query: args.engine.db
				.selectFrom("state_all")
				.where("schema_key", "=", "lix_directory_descriptor")
				.where("version_id", "=", args.versionId)
				.where("entity_id", "=", current)
				.select(["snapshot_content"]),
		});
		if (rows.length === 0) {
			throw new Error(`Parent directory does not exist for id ${current}`);
		}
		const snapshot = rows[0]?.snapshot_content as
			| { parent_id: string | null }
			| string
			| undefined;
		if (!snapshot) {
			current = null;
			continue;
		}
		const parsed =
			typeof snapshot === "string"
				? (JSON.parse(snapshot) as { parent_id: string | null })
				: snapshot;
		current = parsed.parent_id ?? null;
	}
}
