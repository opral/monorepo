import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../../schema-definition/definition.js";
import type { LixEngine } from "../../engine/boot.js";
import { DIRECTORY_PATH_PATTERN } from "../path.js";
import { nanoIdSync } from "../../engine/deterministic/nano-id.js";
import {
	computeDirectoryPath,
	getActiveVersionId,
	readDirectoryByPath,
	readDirectoryPathById,
} from "./ensure-directories.js";
import { executeSync } from "../../database/execute-sync.js";

export const LixDirectoryDescriptorSchema = {
	"x-lix-key": "lix_directory_descriptor",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-unique": [["parent_id", "name"], ["path"]],
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
		path: {
			type: "string",
			pattern: DIRECTORY_PATH_PATTERN as string,
			description: "Absolute directory path ending with '/' (e.g. '/docs/').",
			"x-lix-generated": true,
		},
		hidden: { type: "boolean", "x-lix-generated": true },
	},
	required: ["id", "parent_id", "name", "path"],
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
		const parentId =
			parentIdArg === null || parentIdArg === undefined || parentIdArg === ""
				? null
				: String(parentIdArg);
		const name = String(nameArg ?? "").trim();

		if (!name) {
			throw new Error("Directory name must be provided");
		}

		if (parentId) {
			const parentPath = readDirectoryPathById({
				engine,
				versionId,
				directoryId: parentId,
			});
			if (!parentPath) {
				throw new Error(`Parent directory does not exist for id ${parentId}`);
			}
		}

		let computedPath: string;
		if (pathArg) {
			const providedPath = String(pathArg);
			const expectedPath = computeDirectoryPath({
				engine,
				versionId,
				parentId,
				name,
			});
			if (providedPath !== expectedPath) {
				throw new Error(
					`Provided directory path '${providedPath}' does not match computed path '${expectedPath}'`
				);
			}
			computedPath = expectedPath;
		} else {
			computedPath = computeDirectoryPath({
				engine,
				versionId,
				parentId,
				name,
			});
		}

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
					path: computedPath,
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

	engine.sqlite.exec(`
		CREATE VIEW IF NOT EXISTS directory_all AS
		SELECT
			json_extract(snapshot_content, '$.id') AS id,
			json_extract(snapshot_content, '$.parent_id') AS parent_id,
			json_extract(snapshot_content, '$.name') AS name,
			json_extract(snapshot_content, '$.path') AS path,
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
			json_extract(snapshot_content, '$.path') AS path,
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
		DROP TRIGGER IF EXISTS directory_insert;
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
		DROP TRIGGER IF EXISTS directory_update;
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
		DROP TRIGGER IF EXISTS directory_delete;
		CREATE TRIGGER IF NOT EXISTS directory_delete
		INSTEAD OF DELETE ON directory
		BEGIN
			DELETE FROM file
			WHERE path = substr(OLD.path, 1, length(OLD.path) - 1)
				OR path GLOB substr(OLD.path, 1, length(OLD.path) - 1) || '/*';

			DELETE FROM state_all
			WHERE schema_key = '${schemaKey}'
				AND version_id = (SELECT version_id FROM active_version)
				AND json_extract(snapshot_content, '$.path') GLOB OLD.path || '*';
		END;
	`);

	engine.sqlite.exec(`
		DROP TRIGGER IF EXISTS directory_all_insert;
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
		DROP TRIGGER IF EXISTS directory_all_update;
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
		DROP TRIGGER IF EXISTS directory_all_delete;
		CREATE TRIGGER IF NOT EXISTS directory_all_delete
		INSTEAD OF DELETE ON directory_all
		BEGIN
			DELETE FROM file_all
			WHERE (path = substr(OLD.path, 1, length(OLD.path) - 1)
				OR path GLOB substr(OLD.path, 1, length(OLD.path) - 1) || '/*')
				AND lixcol_version_id = OLD.lixcol_version_id;

			DELETE FROM state_all
			WHERE schema_key = '${schemaKey}'
				AND version_id = OLD.lixcol_version_id
				AND json_extract(snapshot_content, '$.path') GLOB OLD.path || '*';
		END;
	`);
}
