import type { Generated } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import type { ValidationRule, ValidationCallbacks } from "./entity-state.js";
import type { LixGenerated } from "./generic-types.js";

/**
 * Base type for _all entity views (cross-version) that include operational columns from the state table.
 * These views expose lixcol_version_id for version-specific operations.
 *
 * @example
 * ```typescript
 * // Define an entity view type for cross-version operations
 * export type AccountAllView = {
 *   id: Generated<string>;
 *   name: string;
 * } & StateEntityAllView;
 * ```
 */
export type StateEntityAllView = {
	/** File identifier where this entity is stored */
	lixcol_file_id: Generated<string>;
	/** Version identifier when this entity was created/modified */
	lixcol_version_id: Generated<string>;
	/** Version identifier this entity was inherited from (for branching) */
	lixcol_inherited_from_version_id: Generated<string | null>;
	/** Timestamp when this entity was created */
	lixcol_created_at: Generated<string>;
	/** Timestamp when this entity was last updated */
	lixcol_updated_at: Generated<string>;
};

export type EntityStateAllColumns = {
	/** File identifier where this entity is stored */
	lixcol_file_id: LixGenerated<string>;
	/** Version identifier for this state record */
	lixcol_version_id: LixGenerated<string>;
	/** Timestamp when this entity was created */
	lixcol_created_at: LixGenerated<string>;
	/** Timestamp when this entity was last updated */
	lixcol_updated_at: LixGenerated<string>;
	/** Version identifier this entity was inherited from (for branching) */
	lixcol_inherited_from_version_id: LixGenerated<string | null>;
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
	lix: Pick<Lix, "sqlite">;
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
}): void {
	const view_name = args.overrideName ?? args.schema["x-lix-key"] + "_all";

	createSingleEntityAllView({
		...args,
		viewName: view_name,
		stateTable: "state",
	});
}

function createSingleEntityAllView(args: {
	lix: Pick<Lix, "sqlite">;
	schema: LixSchemaDefinition;
	viewName: string;
	stateTable: "state";
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

	// Operational columns for _all view (includes version_id)
	const operationalColumns = [
		"version_id AS lixcol_version_id",
		"inherited_from_version_id AS lixcol_inherited_from_version_id",
		"created_at AS lixcol_created_at",
		"updated_at AS lixcol_updated_at",
		"file_id AS lixcol_file_id",
	];

	// Handle version_id for _all view
	const versionIdReference = args.hardcodedVersionId
		? `'${args.hardcodedVersionId}'`
		: "COALESCE(NEW.lixcol_version_id, (SELECT version_id FROM active_version))";

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
        INSERT INTO state (
          entity_id,
          schema_key,
          file_id,
          plugin_key,
          snapshot_content,
          schema_version,
          version_id
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
          ${versionIdReference.replace(/NEW\./g, "with_default_values.")}
        FROM (
          SELECT
            ${defaultsSubquery},
            ${versionIdInDefaults}
            NEW.lixcol_file_id AS lixcol_file_id
        ) AS with_default_values`
						: `
        VALUES (
          ${entityIdNew},
          '${schema_key}',
          ${fileId},
          '${args.pluginKey}',
          json_object(${properties.map((prop) => `'${prop}', NEW.${prop}`).join(", ")}),
          '${args.schema["x-lix-version"]}',
          ${versionIdReference}
        )`
				};
      END;

      CREATE TRIGGER IF NOT EXISTS ${view_name}_update
      INSTEAD OF UPDATE ON ${view_name}
      BEGIN
        ${updateValidationSQL}
        UPDATE state
        SET
          entity_id = ${entityIdNew},
          schema_key = '${schema_key}',
          file_id = ${fileId},
          plugin_key = '${args.pluginKey}',
          snapshot_content = json_object(${properties.map((prop) => `'${prop}', NEW.${prop}`).join(", ")}),
          version_id = ${versionIdReference}
        WHERE
          state.entity_id = ${entityIdOld}
          AND state.schema_key = '${schema_key}'
          AND state.file_id = ${args.hardcodedFileId ? `'${args.hardcodedFileId}'` : "OLD.lixcol_file_id"}
          AND state.version_id = ${oldVersionIdReference};
      END;

      CREATE TRIGGER IF NOT EXISTS ${view_name}_delete
      INSTEAD OF DELETE ON ${view_name}
      BEGIN
        ${deleteValidationSQL}
        DELETE FROM state
        WHERE entity_id = ${entityIdOld}
        AND schema_key = '${schema_key}'
        AND file_id = ${args.hardcodedFileId ? `'${args.hardcodedFileId}'` : "OLD.lixcol_file_id"}
        ${args.hardcodedVersionId ? `AND version_id = '${args.hardcodedVersionId}'` : ""};
      END;
    `;

	args.lix.sqlite.exec(sqlQuery);
}
