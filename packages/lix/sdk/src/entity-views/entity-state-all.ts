import type { Generated } from "kysely";
import type { LixEngine } from "../engine/boot.js";
import type {
	LixGenerated,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";
import type { ValidationRule, ValidationCallbacks } from "./entity-state.js";
import { buildJsonObjectEntries } from "./build-json-object-entries.js";

/**
 * Base type for _all entity views (cross-version) that include operational columns from the state table.
 * These views expose lixcol_version_id for version-specific operations and allow querying entities
 * across all versions in the database.
 *
 * @example
 * ```typescript
 * // Define an entity view type for cross-version operations
 * export type AccountAllView = {
 *   id: Generated<string>;
 *   name: string;
 * } & StateEntityAllView;
 *
 * // Query entities across versions
 * const accounts = await lix.db
 *   .selectFrom("account_all")
 *   .where("lixcol_version_id", "=", "v1")
 *   .selectAll()
 *   .execute();
 * ```
 */
export type StateEntityAllView = {
	/**
	 * The unique identifier for this entity within its schema and file.
	 *
	 * This is the primary identifier used to reference this specific entity.
	 */
	lixcol_entity_id: Generated<string>;

	/**
	 * The schema key that defines the structure and type of this entity.
	 *
	 * This references the schema definition that validates and types this entity.
	 */
	lixcol_schema_key: Generated<string>;

	/**
	 * File identifier where this entity is stored.
	 *
	 * This references the file_id in the state table and links the entity
	 * to a specific file in the Lix file system.
	 */
	lixcol_file_id: Generated<string>;

	/**
	 * The plugin key that manages this entity type.
	 *
	 * This identifies which plugin is responsible for handling this entity.
	 */
	lixcol_plugin_key: Generated<string>;

	/**
	 * Version identifier for this specific state of the entity.
	 *
	 * This column allows you to query and modify entities in specific versions.
	 * Each version may have its own state for the same entity.
	 */
	lixcol_version_id: Generated<string>;

	/**
	 * Version identifier this entity was inherited from during branching.
	 *
	 * - `null` if the entity was created in this version
	 * - Contains the source version_id if the entity was inherited from another version
	 *
	 * This is useful for tracking entity lineage across version branches.
	 */
	lixcol_inherited_from_version_id: Generated<string | null>;

	/**
	 * Timestamp when this entity was created in this version.
	 *
	 * **Important**: This timestamp is relative to the version specified by lixcol_version_id.
	 * - When an entity is first created, this is the actual creation time
	 * - When an entity is inherited from another version, this is the time it was inherited
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_created_at: Generated<string>;

	/**
	 * Timestamp when this entity was last updated in this version.
	 *
	 * **Important**: This timestamp is relative to the version specified by lixcol_version_id.
	 * - Updates only when the entity is modified within this specific version
	 * - When first inherited, this equals lixcol_created_at
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_updated_at: Generated<string>;

	/**
	 * Change identifier for the last modification to this entity.
	 *
	 * This references the change.id that last modified this entity, enabling
	 * blame and diff functionality. Useful for tracking who made changes
	 * and when they were made.
	 */
	lixcol_change_id: Generated<string>;

	/**
	 * Whether this entity is stored as untracked state.
	 *
	 * - `false` (default): Entity follows normal change control and versioning
	 * - `true`: Entity bypasses change control for UI state, temporary data, etc.
	 *
	 * Untracked entities don't create change records and have highest priority
	 * in the state resolution order: untracked > tracked > inherited.
	 */
	lixcol_untracked: Generated<boolean>;

	/**
	 * Commit identifier that contains this entity's last change.
	 *
	 * This references the commit.id that contains the last change to this entity.
	 * Useful for understanding which commit a particular entity state belongs to,
	 * enabling history queries and version comparison.
	 */
	lixcol_commit_id: Generated<string>;

	/**
	 * Writer key associated with the last mutation that produced this entity state.
	 *
	 * Used to attribute writes to individual clients/sessions for echo suppression.
	 * Null when no writer key was set for the mutation.
	 */
	lixcol_writer_key: Generated<string | null>;

	/**
	 * Arbitrary metadata attached to the change that produced this entity state.
	 */
	lixcol_metadata: Generated<Record<string, any> | null>;
};

/**
 * Base type for _all entity views using LixGenerated markers instead of Kysely's Generated type.
 * This type is compatible with the Lix SDK's type transformation system and allows
 * cross-version entity operations.
 *
 * @example
 * ```typescript
 * // Define an entity type for cross-version operations
 * export type Account = {
 *   id: LixGenerated<string>;
 *   name: string;
 * } & EntityStateAllColumns;
 * ```
 */
export type EntityStateAllColumns = {
	/**
	 * The unique identifier for this entity within its schema and file.
	 *
	 * This is the primary identifier used to reference this specific entity.
	 */
	lixcol_entity_id: LixGenerated<string>;

	/**
	 * The schema key that defines the structure and type of this entity.
	 *
	 * This references the schema definition that validates and types this entity.
	 */
	lixcol_schema_key: LixGenerated<string>;

	/**
	 * File identifier where this entity is stored.
	 *
	 * This references the file_id in the state table and links the entity
	 * to a specific file in the Lix file system.
	 */
	lixcol_file_id: LixGenerated<string>;

	/**
	 * The plugin key that manages this entity type.
	 *
	 * This identifies which plugin is responsible for handling this entity.
	 */
	lixcol_plugin_key: LixGenerated<string>;

	/**
	 * Version identifier for this specific state of the entity.
	 *
	 * This column allows you to query and modify entities in specific versions.
	 * Each version may have its own state for the same entity.
	 */
	lixcol_version_id: LixGenerated<string>;

	/**
	 * Timestamp when this entity was created in this version.
	 *
	 * **Important**: This timestamp is relative to the version specified by lixcol_version_id.
	 * - When an entity is first created, this is the actual creation time
	 * - When an entity is inherited from another version, this is the time it was inherited
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_created_at: LixGenerated<string>;

	/**
	 * Timestamp when this entity was last updated in this version.
	 *
	 * **Important**: This timestamp is relative to the version specified by lixcol_version_id.
	 * - Updates only when the entity is modified within this specific version
	 * - When first inherited, this equals lixcol_created_at
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_updated_at: LixGenerated<string>;

	/**
	 * Version identifier this entity was inherited from during branching.
	 *
	 * - `null` if the entity was created in this version
	 * - Contains the source version_id if the entity was inherited from another version
	 *
	 * This is useful for tracking entity lineage across version branches.
	 */
	lixcol_inherited_from_version_id: LixGenerated<string | null>;

	/**
	 * Change identifier for the last modification to this entity.
	 *
	 * This references the change.id that last modified this entity, enabling
	 * blame and diff functionality. Useful for tracking who made changes
	 * and when they were made.
	 */
	lixcol_change_id: LixGenerated<string>;

	/**
	 * Whether this entity is stored as untracked state.
	 *
	 * - `false` (default): Entity follows normal change control and versioning
	 * - `true`: Entity bypasses change control for UI state, temporary data, etc.
	 *
	 * Untracked entities don't create change records and have highest priority
	 * in the state resolution order: untracked > tracked > inherited.
	 */
	lixcol_untracked: LixGenerated<boolean>;

	/**
	 * Commit identifier that contains this entity's last change.
	 *
	 * This references the commit.id that contains the last change to this entity.
	 * Useful for understanding which commit a particular entity state belongs to,
	 * enabling history queries and version comparison.
	 */
	lixcol_commit_id: LixGenerated<string>;

	/**
	 * Writer key associated with the last mutation that produced this entity state.
	 *
	 * Used to attribute writes to individual clients/sessions for echo suppression.
	 * Null when no writer key was set for the mutation.
	 */
	lixcol_writer_key: LixGenerated<string | null>;

	/**
	 * Arbitrary metadata attached to the change that produced this entity state.
	 */
	lixcol_metadata: LixGenerated<Record<string, any> | null>;
};

/**
 * Creates SQL view and CRUD triggers for an entity based on its schema definition (all versions).
 *
 * This function generates:
 * - A view that extracts JSON properties from the state table (all versions)
 * - INSERT trigger that serializes entity data to JSON in the state table
 * - UPDATE trigger that updates the corresponding state record
 * - DELETE trigger that removes the state record
 *
 * @throws Error if schema type is not "object" or x-lix-primary-key is not defined
 *
 * @example
 * ```typescript
 * // Basic usage for key-value entities
 * createEntityAllViewIfNotExists({
 *   lix,
 *   schema: LixKeyValueSchema,
 *   overrideName: "key_value_all",
 *   pluginKey: "lix_key_value",
 *   hardcodedFileId: "lix"
 * });
 *
 * // With default values for account entities
 * createEntityAllViewIfNotExists({
 *   lix,
 *   schema: LixAccountSchema,
 *   overrideName: "account_all",
 *   pluginKey: "lix_own_entity",
 *   hardcodedFileId: "lix",
 *   defaultValues: {
 *     id: (row) => nanoid()
 *   }
 * });
 * ```
 */
export function createEntityStateAllView(args: {
	engine: Pick<LixEngine, "sqlite">;
	schema: LixSchemaDefinition;
	/** Overrides the view name which defaults to schema["x-lix-key"] + "_all" */
	overrideName?: string;
	/** Plugin identifier for the entity */
	pluginKey: string;
	/** Optional hardcoded file_id (if not provided, uses lixcol_file_id from mutations) */
	hardcodedFileId?: string;
	/** Optional hardcoded version_id (if not provided, uses lixcol_version_id from mutations or active version) */
	hardcodedVersionId?: string;
	/** Object mapping property names to functions that generate default values */
	defaultValues?: Record<
		string,
		(() => string) | ((row: Record<string, any>) => string)
	>;
	/** Custom validation logic for entity operations */
	validation?: ValidationCallbacks;
	/** If true, creates read-only view (no DML triggers) */
	readOnly?: boolean;
}): void {
	const view_name = args.overrideName ?? args.schema["x-lix-key"] + "_all";
	// Quote the view name to handle SQL reserved keywords
	const quoted_view_name = `"${view_name}"`;

	createSingleEntityAllView({
		...args,
		viewName: view_name,
		quotedViewName: quoted_view_name,
		stateTable: "state_all",
	});
}

function createSingleEntityAllView(args: {
	engine: Pick<LixEngine, "sqlite">;
	schema: LixSchemaDefinition;
	viewName: string;
	quotedViewName?: string;
	stateTable: "state_all";
	/** Plugin identifier for the entity */
	pluginKey: string;
	/** Optional hardcoded file_id (if not provided, uses lixcol_file_id from mutations) */
	hardcodedFileId?: string;
	/** Optional hardcoded version_id (if not provided, uses lixcol_version_id from mutations or active version) */
	hardcodedVersionId?: string;
	/** Object mapping property names to functions that generate default values */
	defaultValues?: Record<
		string,
		(() => string) | ((row: Record<string, any>) => string)
	>;
	/** Custom validation logic for entity operations */
	validation?: ValidationCallbacks;
	readOnly?: boolean;
}): void {
	if (!args.schema["x-lix-primary-key"]) {
		throw new Error(
			`Schema must define 'x-lix-primary-key' for entity view generation`
		);
	}

	const view_name = args.viewName;
	const quoted_view_name = args.quotedViewName || `"${view_name}"`;
	const schema_key = args.schema["x-lix-key"];
	const properties = Object.keys((args.schema as any).properties);
	const primaryKeys = args.schema["x-lix-primary-key"];

	const fileId = args.hardcodedFileId
		? `'${args.hardcodedFileId}'`
		: "NEW.lixcol_file_id";
	const entityIdNew =
		primaryKeys.length === 1
			? `NEW.${primaryKeys[0]}`
			: `(${primaryKeys.map((key) => `NEW.${key}`).join(" || '~' || ")})`;
	const entityIdOld =
		primaryKeys.length === 1
			? `OLD.${primaryKeys[0]}`
			: `(${primaryKeys.map((key) => `OLD.${key}`).join(" || '~' || ")})`;

	// Create UDFs for default values
	if (args.defaultValues) {
		for (const [prop, defaultFn] of Object.entries(args.defaultValues)) {
			const udfName = `${schema_key}_default_${prop}`;
			const needsRow = defaultFn.length > 0; // Check if function expects parameters

			if (needsRow) {
				// Function needs row data - use variadic function
				args.engine.sqlite.createFunction(
					udfName,
					(...rowValues: any[]) => {
						// Reconstruct row object from passed values
						// Skip the first argument (pointer/internal value)
						const actualValues = rowValues.slice(1);
						const row: Record<string, any> = {};

						properties.forEach((prop, index) => {
							let value = actualValues[index];

							// Try to parse JSON strings
							if (
								typeof value === "string" &&
								(value.startsWith("{") || value.startsWith("["))
							) {
								try {
									value = JSON.parse(value);
								} catch {
									// Keep as string if JSON parsing fails
								}
							}

							row[prop] = value;
						});

						return (defaultFn as (row: Record<string, any>) => string)(row);
					},
					{ arity: -1 }
				); // -1 means variadic
			} else {
				// Function doesn't need row data - simple 0-arg function
				args.engine.sqlite.createFunction(
					udfName,
					() => (defaultFn as () => string)(),
					{ arity: 0 }
				);
			}
		}
	}

	const generateDefaults = (properties: string[]) => {
		if (!args.defaultValues) {
			return properties
				.map((prop) => `NEW.${prop} AS ${prop}`)
				.join(",\n        ");
		}

		const rowValuesArgs = properties.map((prop) => `NEW.${prop}`).join(", ");

		return properties
			.map((prop) => {
				const defaultFn = args.defaultValues![prop];
				if (defaultFn) {
					const needsRow = defaultFn.length > 0;
					const fnCall = needsRow
						? `${schema_key}_default_${prop}(${rowValuesArgs})`
						: `${schema_key}_default_${prop}()`;
					return `COALESCE(NEW.${prop}, ${fnCall}) AS ${prop}`;
				} else {
					return `NEW.${prop} AS ${prop}`;
				}
			})
			.join(",\n        ");
	};

	const defaultsSubquery = generateDefaults(properties);
	const hasDefaults =
		args.defaultValues && Object.keys(args.defaultValues).length > 0;

	// Operational columns for _all view (includes version_id)
	const operationalColumns = [
		"entity_id AS lixcol_entity_id",
		"schema_key AS lixcol_schema_key",
		"file_id AS lixcol_file_id",
		"plugin_key AS lixcol_plugin_key",
		"version_id AS lixcol_version_id",
		"inherited_from_version_id AS lixcol_inherited_from_version_id",
		"created_at AS lixcol_created_at",
		"updated_at AS lixcol_updated_at",
		"change_id AS lixcol_change_id",
		"untracked AS lixcol_untracked",
		"commit_id AS lixcol_commit_id",
		"metadata AS lixcol_metadata",
	];

	// Handle version_id for _all view
	const versionIdReference = args.hardcodedVersionId
		? `'${args.hardcodedVersionId}'`
		: "NEW.lixcol_version_id";

	const versionIdInDefaults = "NEW.lixcol_version_id AS lixcol_version_id,";

	const oldVersionIdReference = args.hardcodedVersionId
		? `'${args.hardcodedVersionId}'`
		: "OLD.lixcol_version_id";

	// Generate validation SQL
	const generateValidationSQL = (rules: ValidationRule[]): string => {
		return rules
			.map(
				(rule) => `
			SELECT CASE
				WHEN NOT (${rule.condition})
				THEN RAISE(FAIL, '${rule.errorMessage.replace(/'/g, "''")}')
			END;`
			)
			.join("\n");
	};

	const insertValidationSQL = args.validation?.onInsert
		? generateValidationSQL(args.validation.onInsert)
		: "";

	const updateValidationSQL = args.validation?.onUpdate
		? generateValidationSQL(args.validation.onUpdate)
		: "";

	const deleteValidationSQL = args.validation?.onDelete
		? generateValidationSQL(args.validation.onDelete)
		: "";

	// Helper for json_object entries per schema types
	const buildJsonEntries = (refExpr: (prop: string) => string): string =>
		buildJsonObjectEntries({ schema: args.schema, ref: refExpr });

	// Generated SQL query - set breakpoint here to inspect the generated SQL during debugging
	// Apply the hardcoded file filter at view definition time so queries hit the
	// `(schema_key, version_id, file_id)` indexes directly. Without this clause
	// SQLite would scan every file for the same version whenever callers read or
	// update `_all` views.
	const fileFilterClause = args.hardcodedFileId
		? ` AND file_id = '${args.hardcodedFileId}'`
		: "";

	const sqlQuery =
		`
    CREATE VIEW IF NOT EXISTS ${quoted_view_name} AS
      SELECT
        ${Object.keys((args.schema as any).properties)
					.map(
						(prop) => `json_extract(snapshot_content, '$.${prop}') AS ${prop}`
					)
					.join(",\n        ")},
        ${operationalColumns.join(",\n        ")}
      FROM ${args.stateTable}
      WHERE schema_key = '${schema_key}'${fileFilterClause};
    ` +
		(args.readOnly
			? ""
			: `

      CREATE TRIGGER IF NOT EXISTS ${view_name}_insert
      INSTEAD OF INSERT ON ${quoted_view_name}
      BEGIN      
        ${insertValidationSQL}
        INSERT INTO state_all (
          entity_id,
          schema_key,
          file_id,
          plugin_key,
          snapshot_content,
          schema_version,
          version_id,
          metadata,
          untracked
        ) ${
					hasDefaults
						? `
        SELECT 
          ${entityIdNew.replace(/NEW\./g, "with_default_values.")},
          '${schema_key}',
          ${fileId.replace(/NEW\./g, "with_default_values.")},
          '${args.pluginKey}',
          json_object(${buildJsonEntries((prop) => `with_default_values.${prop}`)}),
          '${args.schema["x-lix-version"]}',
          ${versionIdReference.replace(/NEW\./g, "with_default_values.")},
          with_default_values.lixcol_metadata,
          COALESCE(with_default_values.lixcol_untracked, 0)
        FROM (
          SELECT
            ${defaultsSubquery},
            ${versionIdInDefaults}
            NEW.lixcol_file_id AS lixcol_file_id,
            NEW.lixcol_metadata AS lixcol_metadata,
            COALESCE(NEW.lixcol_untracked, 0) AS lixcol_untracked
        ) AS with_default_values`
						: `
        VALUES (
          ${entityIdNew},
          '${schema_key}',
          ${fileId},
          '${args.pluginKey}',
          json_object(${buildJsonEntries((prop) => `NEW.${prop}`)}),
          '${args.schema["x-lix-version"]}',
          ${versionIdReference},
          NEW.lixcol_metadata,
          COALESCE(NEW.lixcol_untracked, 0)
        )`
				};
      END;

      CREATE TRIGGER IF NOT EXISTS ${view_name}_update
      INSTEAD OF UPDATE ON ${quoted_view_name}
      BEGIN
        ${updateValidationSQL}
        UPDATE state_all
        SET
          entity_id = ${entityIdNew},
          schema_key = '${schema_key}',
          file_id = ${fileId},
          plugin_key = '${args.pluginKey}',
          snapshot_content = json_object(${buildJsonEntries((prop) => `NEW.${prop}`)}),
          version_id = ${versionIdReference},
          metadata = NEW.lixcol_metadata,
          untracked = NEW.lixcol_untracked
        WHERE
          state_all.entity_id = ${entityIdOld}
          AND state_all.schema_key = '${schema_key}'
          AND state_all.file_id = ${args.hardcodedFileId ? `'${args.hardcodedFileId}'` : "OLD.lixcol_file_id"}
          AND state_all.version_id = ${oldVersionIdReference};
      END;

      CREATE TRIGGER IF NOT EXISTS ${view_name}_delete
      INSTEAD OF DELETE ON ${quoted_view_name}
      BEGIN
        ${deleteValidationSQL}
        DELETE FROM state_all
        WHERE entity_id = ${entityIdOld}
        AND schema_key = '${schema_key}'
        AND file_id = ${args.hardcodedFileId ? `'${args.hardcodedFileId}'` : "OLD.lixcol_file_id"}
        AND version_id = ${args.hardcodedVersionId ? `'${args.hardcodedVersionId}'` : "OLD.lixcol_version_id"};
      END;
    `);

	args.engine.sqlite.exec(sqlQuery);
}
