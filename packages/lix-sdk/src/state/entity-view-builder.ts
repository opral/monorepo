import type { Generated } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

/**
 * Base type for all entity views that include operational columns from the state table.
 *
 * This type should be extended by entity-specific view types to include both
 * business logic properties and the standard operational columns that Lix adds
 * to all entity views.
 *
 * @example
 * ```typescript
 * // Define an entity view type by combining business properties with StateEntityView
 * export type AccountView = {
 *   id: Generated<string>;
 *   name: string;
 * } & StateEntityView;
 *
 * // Use with Kysely operation types
 * export type Account = Selectable<AccountView>;
 * export type NewAccount = Insertable<AccountView>;
 * export type AccountUpdate = Updateable<AccountView>;
 * ```
 */
export type StateEntityView = {
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

/**
 * Creates a SQL view and CRUD triggers for an entity based on its schema definition.
 *
 * This function automatically generates:
 *
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
 * createEntityViewsIfNotExists({
 *   lix,
 *   schema: LixKeyValueSchema,
 *   overrideName: "key_value",
 *   pluginKey: "lix_key_value",
 *   hardcodedFileId: "lix"
 * });
 *
 * // With default values for account entities
 * createEntityViewsIfNotExists({
 *   lix,
 *   schema: LixAccountSchema,
 *   overrideName: "account",
 *   pluginKey: "lix_own_entity",
 *   hardcodedFileId: "lix",
 *   defaultValues: {
 *     id: () => nanoid(),
 *     created_at: () => new Date().toISOString()
 *   }
 * });
 * ```
 */
export function createEntityViewsIfNotExists(args: {
	lix: Pick<Lix, "sqlite">;
	schema: LixSchemaDefinition;
	/** Overrides the view name which defaults to schema["x-lix-key"] */
	overrideName?: string;
	/** Plugin identifier for the entity */
	pluginKey: string;
	/** Optional hardcoded file_id (if not provided, uses lixcol_file_id from mutations) */
	hardcodedFileId?: string;
	/** Object mapping property names to functions that generate default values */
	defaultValues?: Record<string, () => string>;
}): void {
	if (!args.schema["x-lix-primary-key"]) {
		throw new Error(
			`Schema must define 'x-lix-primary-key' for entity view generation`
		);
	}

	const view_name = args.overrideName ?? args.schema["x-lix-key"];
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
			args.lix.sqlite.createFunction(udfName, () => defaultFn());
		}
	}

	const generateDefaults = (properties: string[]) => {
		if (!args.defaultValues) {
			return properties
				.map((prop) => `NEW.${prop} AS ${prop}`)
				.join(",\n        ");
		}

		return properties
			.map((prop) => {
				const hasDefault = args.defaultValues![prop];
				return hasDefault
					? `COALESCE(NEW.${prop}, ${schema_key}_default_${prop}()) AS ${prop}`
					: `NEW.${prop} AS ${prop}`;
			})
			.join(",\n        ");
	};

	const defaultsSubquery = generateDefaults(properties);
	const hasDefaults =
		args.defaultValues && Object.keys(args.defaultValues).length > 0;

	args.lix.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS ${view_name} AS
      SELECT
        ${Object.keys((args.schema as any).properties)
					.map(
						(prop) => `json_extract(snapshot_content, '$.${prop}') AS ${prop}`
					)
					.join(",\n        ")},
        version_id AS lixcol_version_id,
        inherited_from_version_id AS lixcol_inherited_from_version_id,
        created_at AS lixcol_created_at,
        updated_at AS lixcol_updated_at,
        file_id AS lixcol_file_id
      FROM state
      WHERE schema_key = '${schema_key}';

      CREATE TRIGGER IF NOT EXISTS ${view_name}_insert
      INSTEAD OF INSERT ON ${view_name}
      BEGIN      
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
          COALESCE(with_default_values.lixcol_version_id, (SELECT version_id FROM active_version))
        FROM (
          SELECT
            ${defaultsSubquery},
            NEW.lixcol_version_id AS lixcol_version_id,
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
          COALESCE(NEW.lixcol_version_id, (SELECT version_id FROM active_version))
        )`
				};
      END;

      CREATE TRIGGER IF NOT EXISTS ${view_name}_update
      INSTEAD OF UPDATE ON ${view_name}
      BEGIN
        UPDATE state
        SET
          entity_id = ${entityIdNew},
          schema_key = '${schema_key}',
          file_id = ${fileId},
          plugin_key = '${args.pluginKey}',
          snapshot_content = json_object(${properties.map((prop) => `'${prop}', NEW.${prop}`).join(", ")}),
          version_id = COALESCE(NEW.lixcol_version_id, (SELECT version_id FROM active_version))
        WHERE
          state.entity_id = ${entityIdOld}
          AND state.schema_key = '${schema_key}'
          AND state.file_id = ${args.hardcodedFileId ? `'${args.hardcodedFileId}'` : "OLD.lixcol_file_id"}
          AND state.version_id = OLD.lixcol_version_id;
      END;

      CREATE TRIGGER IF NOT EXISTS ${view_name}_delete
      INSTEAD OF DELETE ON ${view_name}
      BEGIN
        DELETE FROM state
        WHERE entity_id = ${entityIdOld}
        AND schema_key = '${schema_key}'
        AND file_id = ${args.hardcodedFileId ? `'${args.hardcodedFileId}'` : "OLD.lixcol_file_id"};
      END;
    `);
}
