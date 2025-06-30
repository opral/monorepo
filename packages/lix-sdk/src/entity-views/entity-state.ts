import type { Generated } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import type {
	LixGenerated,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

/**
 * Base type for regular entity views (active version only) that include operational columns from the state table.
 * These views do NOT expose lixcol_version_id to prevent accidental version-specific operations.
 *
 * @example
 * ```typescript
 * // Define an entity view type for active version operations
 * export type AccountView = {
 *   id: Generated<string>;
 *   name: string;
 * } & StateEntityView;
 * ```
 */
export type StateEntityView = {
	/**
	 * File identifier where this entity is stored.
	 *
	 * This references the file_id in the state table and links the entity
	 * to a specific file in the Lix file system.
	 */
	lixcol_file_id: Generated<string>;

	/**
	 * Version identifier this entity was inherited from during branching.
	 *
	 * - `null` if the entity was created in the current version
	 * - Contains the source version_id if the entity was inherited from another version
	 *
	 * This is useful for tracking entity lineage across version branches.
	 */
	lixcol_inherited_from_version_id: Generated<string | null>;

	/**
	 * Timestamp when this entity was created in the current version.
	 *
	 * **Important**: This timestamp is relative to the version, not global.
	 * - When an entity is first created, this is the actual creation time
	 * - When an entity is inherited from another version, this is the time it was inherited
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_created_at: Generated<string>;

	/**
	 * Timestamp when this entity was last updated in the current version.
	 *
	 * **Important**: This timestamp is relative to the version, not global.
	 * - Updates only when the entity is modified within the current version
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
};

/**
 * Base type for regular entity views (active version only) that include operational columns from the state table.
 * These views do NOT expose lixcol_version_id to prevent accidental version-specific operations.
 *
 * This type uses LixGenerated markers instead of Kysely's Generated type, making it compatible
 * with the Lix SDK's type transformation system.
 *
 * @example
 * ```typescript
 * // Define an entity view type for active version operations
 * export type AccountView = {
 *   id: LixGenerated<string>;
 *   name: string;
 * } & EntityStateColumns;
 * ```
 */
export type EntityStateColumns = {
	/**
	 * File identifier where this entity is stored.
	 *
	 * This references the file_id in the state table and links the entity
	 * to a specific file in the Lix file system.
	 */
	lixcol_file_id: LixGenerated<string>;

	/**
	 * Version identifier this entity was inherited from during branching.
	 *
	 * - `null` if the entity was created in the current version
	 * - Contains the source version_id if the entity was inherited from another version
	 *
	 * This is useful for tracking entity lineage across version branches.
	 */
	lixcol_inherited_from_version_id: LixGenerated<string | null>;

	/**
	 * Timestamp when this entity was created in the current version.
	 *
	 * **Important**: This timestamp is relative to the version, not global.
	 * - When an entity is first created, this is the actual creation time
	 * - When an entity is inherited from another version, this is the time it was inherited
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_created_at: LixGenerated<string>;

	/**
	 * Timestamp when this entity was last updated in the current version.
	 *
	 * **Important**: This timestamp is relative to the version, not global.
	 * - Updates only when the entity is modified within the current version
	 * - When first inherited, this equals lixcol_created_at
	 *
	 * Format: ISO 8601 string (e.g., "2024-03-20T10:30:00.000Z")
	 */
	lixcol_updated_at: LixGenerated<string>;

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
};

/**
 * Validation rule for SQL trigger generation.
 */
export type ValidationRule = {
	/** SQL condition that must be true, or error will be raised */
	condition: string;
	/** Error message to display when validation fails */
	errorMessage: string;
};

/**
 * Validation callbacks for entity operations.
 * These are converted to SQL validation triggers.
 */
export type ValidationCallbacks = {
	/** Validation logic for INSERT operations */
	onInsert?: ValidationRule[];
	/** Validation logic for UPDATE operations */
	onUpdate?: ValidationRule[];
	/** Validation logic for DELETE operations */
	onDelete?: ValidationRule[];
};

/**
 * Creates SQL view and CRUD triggers for an entity based on its schema definition (active version only).
 *
 * This function generates:
 * - A view that extracts JSON properties from the state table
 * - INSERT trigger that serializes entity data to JSON in the state table
 * - UPDATE trigger that updates the corresponding state record
 * - DELETE trigger that removes the state record
 *
 * @throws Error if schema type is not "object" or x-lix-primary-key is not defined
 *
 * @example
 * ```typescript
 * // Basic usage for key-value entities
 * createEntityViewIfNotExists({
 *   lix,
 *   schema: LixKeyValueSchema,
 *   overrideName: "key_value",
 *   pluginKey: "lix_key_value",
 *   hardcodedFileId: "lix"
 * });
 *
 * // With default values for account entities
 * createEntityViewIfNotExists({
 *   lix,
 *   schema: LixAccountSchema,
 *   overrideName: "account",
 *   pluginKey: "lix_own_entity",
 *   hardcodedFileId: "lix",
 *   defaultValues: {
 *     id: (row) => nanoid()
 *   }
 * });
 * ```
 */
export function createEntityStateView(args: {
	lix: Pick<Lix, "sqlite">;
	schema: LixSchemaDefinition;
	/** Overrides the view name which defaults to schema["x-lix-key"] */
	overrideName?: string;
	/** Plugin identifier for the entity */
	pluginKey: string;
	/** Optional hardcoded file_id (if not provided, uses lixcol_file_id from mutations) */
	hardcodedFileId?: string;
	/** Optional hardcoded version_id (if not provided, uses active version) */
	hardcodedVersionId?: string;
	/** Object mapping property names to functions that generate default values */
	defaultValues?: Record<
		string,
		(() => string) | ((row: Record<string, any>) => string)
	>;
	/** Custom validation logic for entity operations */
	validation?: ValidationCallbacks;
}): void {
	const view_name = args.overrideName ?? args.schema["x-lix-key"];

	createSingleEntityView({
		...args,
		viewName: view_name,
		stateTable: "state",
	});
}

function createSingleEntityView(args: {
	lix: Pick<Lix, "sqlite">;
	schema: LixSchemaDefinition;
	viewName: string;
	stateTable: "state";
	/** Plugin identifier for the entity */
	pluginKey: string;
	/** Optional hardcoded file_id (if not provided, uses lixcol_file_id from mutations) */
	hardcodedFileId?: string;
	/** Optional hardcoded version_id (if not provided, uses active version) */
	hardcodedVersionId?: string;
	/** Object mapping property names to functions that generate default values */
	defaultValues?: Record<
		string,
		(() => string) | ((row: Record<string, any>) => string)
	>;
	/** Custom validation logic for entity operations */
	validation?: ValidationCallbacks;
}): void {
	if (!args.schema["x-lix-primary-key"]) {
		throw new Error(
			`Schema must define 'x-lix-primary-key' for entity view generation`
		);
	}

	const view_name = args.viewName;
	const schema_key = args.schema["x-lix-key"];
	const properties = Object.keys((args.schema as any).properties);
	const primaryKeys = args.schema["x-lix-primary-key"];

	const fileId = args.hardcodedFileId
		? `'${args.hardcodedFileId}'`
		: "NEW.lixcol_file_id";
	const entityIdNew =
		primaryKeys.length === 1
			? `NEW.${primaryKeys[0]}`
			: `(${primaryKeys.map((key) => `NEW.${key}`).join(" || '::' || ")})`;
	const entityIdOld =
		primaryKeys.length === 1
			? `OLD.${primaryKeys[0]}`
			: `(${primaryKeys.map((key) => `OLD.${key}`).join(" || '::' || ")})`;

	// Create UDFs for default values
	if (args.defaultValues) {
		for (const [prop, defaultFn] of Object.entries(args.defaultValues)) {
			const udfName = `${schema_key}_default_${prop}`;
			const needsRow = defaultFn.length > 0; // Check if function expects parameters

			if (needsRow) {
				// Function needs row data - use variadic function
				args.lix.sqlite.createFunction(
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
				args.lix.sqlite.createFunction(
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

	// Operational columns for active view (no version_id exposed)
	const operationalColumns = [
		"inherited_from_version_id AS lixcol_inherited_from_version_id",
		"created_at AS lixcol_created_at",
		"updated_at AS lixcol_updated_at",
		"file_id AS lixcol_file_id",
		"change_id AS lixcol_change_id",
		"untracked AS lixcol_untracked",
	];

	// Handle version_id for active view
	const versionIdReference = args.hardcodedVersionId
		? `'${args.hardcodedVersionId}'`
		: "(SELECT version_id FROM active_version)";

	const oldVersionIdReference = args.hardcodedVersionId
		? `'${args.hardcodedVersionId}'`
		: "(SELECT version_id FROM active_version)";

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

	// Generated SQL query - set breakpoint here to inspect the generated SQL during debugging
	const sqlQuery = `
    CREATE VIEW IF NOT EXISTS ${view_name} AS
      SELECT
        ${Object.keys((args.schema as any).properties)
					.map(
						(prop) => `json_extract(snapshot_content, '$.${prop}') AS ${prop}`
					)
					.join(",\n        ")},
        ${operationalColumns.join(",\n        ")}
      FROM ${args.stateTable}
      WHERE schema_key = '${schema_key}';

      CREATE TRIGGER IF NOT EXISTS ${view_name}_insert
      INSTEAD OF INSERT ON ${view_name}
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
          untracked
        ) ${
					hasDefaults
						? `
        SELECT 
          ${entityIdNew.replace(/NEW\./g, "with_default_values.")},
          '${schema_key}',
          ${fileId.replace(/NEW\./g, "with_default_values.")},
          '${args.pluginKey}',
          json_object(${properties.map((prop) => `'${prop}', with_default_values.${prop}`).join(", ")}),
          '${args.schema["x-lix-version"]}',
          ${versionIdReference.replace(/NEW\./g, "with_default_values.")},
          with_default_values.lixcol_untracked
        FROM (
          SELECT
            ${defaultsSubquery},
            NEW.lixcol_file_id AS lixcol_file_id,
            NEW.lixcol_untracked AS lixcol_untracked
        ) AS with_default_values`
						: `
        VALUES (
          ${entityIdNew},
          '${schema_key}',
          ${fileId},
          '${args.pluginKey}',
          json_object(${properties.map((prop) => `'${prop}', NEW.${prop}`).join(", ")}),
          '${args.schema["x-lix-version"]}',
          ${versionIdReference},
          NEW.lixcol_untracked
        )`
				};
      END;

      CREATE TRIGGER IF NOT EXISTS ${view_name}_update
      INSTEAD OF UPDATE ON ${view_name}
      BEGIN
        ${updateValidationSQL}
        UPDATE state_all
        SET
          entity_id = ${entityIdNew},
          schema_key = '${schema_key}',
          file_id = ${fileId},
          plugin_key = '${args.pluginKey}',
          snapshot_content = json_object(${properties.map((prop) => `'${prop}', NEW.${prop}`).join(", ")}),
          version_id = ${versionIdReference},
          untracked = NEW.lixcol_untracked
        WHERE
          state_all.entity_id = ${entityIdOld}
          AND state_all.schema_key = '${schema_key}'
          AND state_all.file_id = ${args.hardcodedFileId ? `'${args.hardcodedFileId}'` : "OLD.lixcol_file_id"}
          AND state_all.version_id = ${oldVersionIdReference};
      END;

      CREATE TRIGGER IF NOT EXISTS ${view_name}_delete
      INSTEAD OF DELETE ON ${view_name}
      BEGIN
        ${deleteValidationSQL}
        DELETE FROM state_all
        WHERE entity_id = ${entityIdOld}
        AND schema_key = '${schema_key}'
        AND file_id = ${args.hardcodedFileId ? `'${args.hardcodedFileId}'` : "OLD.lixcol_file_id"}
        ${args.hardcodedVersionId ? `AND version_id = '${args.hardcodedVersionId}'` : ""};
      END;
    `;

	args.lix.sqlite.exec(sqlQuery);
}
