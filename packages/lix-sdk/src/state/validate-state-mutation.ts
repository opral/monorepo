import { Ajv } from "ajv";
import type { Lix } from "../lix/open-lix.js";
import { LixSchemaDefinition } from "../schema-definition/definition.js";
import { executeSync } from "../database/execute-sync.js";
import { sql, type Kysely } from "kysely";
import type { LixChange } from "../change/schema.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

/**
 * List of special entity types that are not stored as JSON in the state table,
 * but have their own dedicated SQL tables.
 */
const SPECIAL_ENTITIES = ["lix_change", "state"] as const;

const ajv = new Ajv({
	strict: true,
	// allow 'x-*' properties in alignment with new json schema spec
	// https://json-schema.org/blog/posts/stable-json-schema
	strictSchema: false,
});
const validateLixSchema = ajv.compile(LixSchemaDefinition);

export function validateStateMutation(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition | null;
	snapshot_content: LixChange["snapshot_content"];
	operation: "insert" | "update" | "delete";
	entity_id?: string;
	version_id: string;
	untracked?: boolean;
}): void {
	// console.log(`validateStateMutation called with operation: ${args.operation}, schema: ${args.schema?.["x-lix-key"]}, entity_id: ${args.entity_id}`);
	// Validate version_id is provided
	// Skip validation if schema is null (during initialization when schemas aren't stored yet)
	if (!args.schema) {
		return;
	}

	if (!args.version_id) {
		throw new Error("version_id is required");
	}

	const existingVersion = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("version")
			.select("id")
			.where("id", "=", args.version_id),
		// .where("version.lixcol_version_id", "=", args.version_id),
	});

	if (existingVersion.length === 0) {
		throw new Error(`Version with id '${args.version_id}' does not exist`);
	}

	const isValidLixSchema = validateLixSchema(args.schema);

	if (!isValidLixSchema) {
		throw new Error(
			`The provided schema is not a valid lix schema: ${ajv.errorsText(validateLixSchema.errors)}`
		);
	}

	// Skip snapshot content validation for delete operations
	if (args.operation !== "delete") {
		// Parse JSON strings back to objects for properties defined as objects in the schema
		const parsedSnapshotContent = parseJsonPropertiesInSnapshotContent(
			args.snapshot_content,
			args.schema
		);

		const isValidSnapshotContent = ajv.validate(
			args.schema,
			parsedSnapshotContent
		);

		if (!isValidSnapshotContent) {
			const errorDetails = ajv.errors
				?.map((error) => {
					const receivedValue = error.instancePath
						? getValueByPath(parsedSnapshotContent, error.instancePath)
						: parsedSnapshotContent;
					return `${error.instancePath} ${error.message}. Received value: ${JSON.stringify(receivedValue)}`;
				})
				.join("; ");

			throw new Error(
				`The provided snapshot content does not match the schema '${args.schema["x-lix-key"]}' (${args.schema["x-lix-version"]}).\n\n ${errorDetails || ajv.errorsText(ajv.errors)}`
			);
		}
	}

	// For deletion operations, validate foreign key references to prevent deletion
	if (args.operation === "delete") {
		validateDeletionConstraints({
			lix: args.lix,
			schema: args.schema,
			entity_id: args.entity_id,
			version_id: args.version_id,
		});
	} else {
		// Validate primary key constraints (only for insert/update)
		if (args.schema["x-lix-primary-key"]) {
			validatePrimaryKeyConstraints({
				lix: args.lix,
				schema: args.schema,
				snapshot_content: args.snapshot_content,
				operation: args.operation,
				entity_id: args.entity_id,
				version_id: args.version_id,
			});
		}

		// Validate unique constraints (only for insert/update)
		if (args.schema["x-lix-unique"]) {
			validateUniqueConstraints({
				lix: args.lix,
				schema: args.schema,
				snapshot_content: args.snapshot_content,
				operation: args.operation,
				entity_id: args.entity_id,
				version_id: args.version_id,
			});
		}

		// Validate foreign key constraints (only for insert/update)
		if (args.schema["x-lix-foreign-keys"]) {
			validateForeignKeyConstraints({
				lix: args.lix,
				schema: args.schema,
				snapshot_content: args.snapshot_content,
				version_id: args.version_id,
				untracked: args.untracked,
			});
		}
	}

	// Hardcoded validation for commit_edge self-referencing
	if (args.schema["x-lix-key"] === "lix_commit_edge") {
		const content = args.snapshot_content as any;
		if (content.parent_id === content.child_id) {
			throw new Error(
				"Self-referencing edges are not allowed: parent_id cannot equal child_id"
			);
		}

		// Check for cycles if lix_debug is enabled
		if (args.operation === "insert") {
			const debugEnabled = executeSync({
				lix: args.lix,
				query: args.lix.db
					.selectFrom("key_value_all")
					.select("value")
					.where("key", "=", "lix_debug")
					.where("value", "=", "true"),
			});

			if (debugEnabled.length > 0 && debugEnabled[0].value === "true") {
				validateAcyclicCommitGraph({
					lix: args.lix,
					newEdge: content,
					version_id: args.version_id,
				});
			}
		}
	}
}

function validatePrimaryKeyConstraints(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
	snapshot_content: LixChange["snapshot_content"];
	operation: "insert" | "update" | "delete";
	entity_id?: string;
	version_id: string;
}): void {
	const primaryKeyFields = args.schema["x-lix-primary-key"];
	if (!primaryKeyFields || primaryKeyFields.length === 0) {
		return;
	}

	// Extract primary key values from the snapshot content
	const primaryKeyValues: any[] = [];
	for (const field of primaryKeyFields) {
		const value = (args.snapshot_content as any)[field];
		if (value === undefined || value === null) {
			throw new Error(
				`Primary key field '${field}' cannot be null or undefined`
			);
		}
		primaryKeyValues.push(value);
	}

	// Query existing resolved state (including cache/untracked/inherited) to check for duplicates,
	// but ignore transaction rows (tag 'T' in _pk) so that multiple inserts within the same
	// transaction can overwrite without tripping PK validation.
	const db = args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
	let query = db
		.selectFrom("internal_resolved_state_all")
		.select(["snapshot_content"])
		.where("schema_key", "=", args.schema["x-lix-key"]);

	// Constrain by version – internal_resolved_state_all exposes child version_id directly
	query = query.where("version_id", "=", args.version_id);
	// Exclude tombstones
	query = query.where("snapshot_content", "is not", null);

	// Exclude transaction-state rows: _pk starting with 'T~'
	query = query.where(sql`_pk NOT LIKE 'T~%'` as any);

	// For updates, exclude the current entity from the check
	if (args.operation === "update" && args.entity_id) {
		query = query.where("entity_id", "!=", args.entity_id);
	}

	// Build WHERE conditions for each primary key field
	for (let i = 0; i < primaryKeyFields.length; i++) {
		const field = primaryKeyFields[i];
		const value = primaryKeyValues[i];
		// Use JSON extraction to check the field value in the content
		query = query.where(
			sql`json_extract(snapshot_content, '$.' || ${field})`,
			"=",
			value
		);
	}

	const existingStates = executeSync({ lix: args.lix, query });

	if (existingStates.length > 0) {
		const fieldNames = primaryKeyFields.join(", ");
		const fieldValues = primaryKeyValues.map((v) => `'${v}'`).join(", ");

		throw new Error(
			`Primary key constraint violation: The primary key constraint on (${fieldNames}) is violated by values (${fieldValues})`
		);
	}
}

function validateUniqueConstraints(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
	snapshot_content: LixChange["snapshot_content"];
	operation: "insert" | "update" | "delete";
	entity_id?: string;
	version_id: string;
}): void {
	const uniqueConstraints = args.schema["x-lix-unique"];
	if (!uniqueConstraints || uniqueConstraints.length === 0) {
		return;
	}

	// Validate each unique constraint
	for (const uniqueFields of uniqueConstraints) {
		if (!uniqueFields || uniqueFields.length === 0) {
			continue;
		}

		// Extract values for this unique constraint
		const uniqueValues: any[] = [];
		for (const field of uniqueFields) {
			const value = (args.snapshot_content as any)[field];
			if (value === undefined || value === null) {
				// Skip unique constraint validation if any field is null/undefined
				// This allows nullable unique fields (like SQL UNIQUE constraints)
				continue;
			}
			uniqueValues.push(value);
		}

		// If we didn't get all values (some were null), skip this constraint
		if (uniqueValues.length !== uniqueFields.length) {
			continue;
		}

		// Query existing resolved state for duplicates, excluding transaction-state rows (tag 'T')
		const db = args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		let query = db
			.selectFrom("internal_resolved_state_all")
			.select(["snapshot_content"])
			.where("schema_key", "=", args.schema["x-lix-key"]);

		query = query.where("version_id", "=", args.version_id);
		// Exclude tombstones
		query = query.where("snapshot_content", "is not", null);
		query = query.where(sql`_pk NOT LIKE 'T~%'` as any);

		// For updates, exclude the current entity from the check
		if (args.operation === "update" && args.entity_id) {
			query = query.where("entity_id", "!=", args.entity_id);
		}

		// Build WHERE conditions for each field in the unique constraint
		for (let i = 0; i < uniqueFields.length; i++) {
			const field = uniqueFields[i];
			const value = uniqueValues[i];
			// Use JSON extraction to check the field value in the content
			query = query.where(
				sql`json_extract(snapshot_content, '$.' || ${field})`,
				"=",
				value
			);
		}

		const existingStates = executeSync({ lix: args.lix, query });

		if (existingStates.length > 0) {
			const fieldNames = uniqueFields.join(", ");
			const fieldValues = uniqueValues.map((v) => `'${v}'`).join(", ");

			throw new Error(
				`Unique constraint violation: The unique constraint on (${fieldNames}) is violated by values (${fieldValues})`
			);
		}
	}
}

// Helper function to get nested value by path (e.g., 'foo.bar' from { foo: { bar: 'baz' } })
function getValueByPath(obj: any, path: string): any {
	if (!path) return obj;
	const parts = path.split("/").filter((part) => part);
	let current = obj;
	for (const part of parts) {
		if (current === undefined || current === null) return undefined;
		current = current[part];
	}
	return current;
}

function validateForeignKeyConstraints(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
	snapshot_content: LixChange["snapshot_content"];
	version_id: string;
	untracked?: boolean;
}): void {
	const foreignKeys = args.schema["x-lix-foreign-keys"];
	if (!foreignKeys || !Array.isArray(foreignKeys)) {
		return;
	}

	// Validate each foreign key constraint
	for (const foreignKey of foreignKeys) {
		// Validate that properties arrays have same length
		if (
			foreignKey.properties.length !== foreignKey.references.properties.length
		) {
			throw new Error(
				`Foreign key constraint error: Local properties (${foreignKey.properties.join(", ")}) and ` +
					`referenced properties (${foreignKey.references.properties.join(", ")}) must have the same length`
			);
		}

		// Extract values for all local properties
		const localValues: any[] = [];
		let hasNullValue = false;

		for (const localProperty of foreignKey.properties) {
			const value = (args.snapshot_content as any)[localProperty];
			if (value === null || value === undefined) {
				hasNullValue = true;
				break;
			}
			localValues.push(value);
		}

		// Skip validation if any foreign key value is null or undefined
		// (like SQL foreign keys, null values are allowed)
		if (hasNullValue) {
			continue;
		}

		// Check if this references a special entity with its own SQL table
		const isSpecialEntity = SPECIAL_ENTITIES.includes(
			foreignKey.references.schemaKey as any
		);

		let query: any;
		if (isSpecialEntity) {
			// Query the dedicated SQL table directly
			// Map schema key to actual table name
			const tableName =
				foreignKey.references.schemaKey === "lix_change"
					? "change"
					: foreignKey.references.schemaKey;

			// Special handling for state table which supports composite keys
			if (foreignKey.references.schemaKey === "state") {
				query = args.lix.db
					.selectFrom("state_all" as any)
					.select(foreignKey.references.properties as any);

				// Add WHERE conditions for each property
				for (let i = 0; i < foreignKey.properties.length; i++) {
					const refProperty = foreignKey.references.properties[i];
					const localValue = localValues[i];
					query = query.where(refProperty as any, "=", localValue);
				}
			} else {
				// For other special entities, we only support single property references
				if (foreignKey.properties.length !== 1) {
					throw new Error(
						`Foreign key constraint error: Special entity '${foreignKey.references.schemaKey}' references only support single property, ` +
							`but got ${foreignKey.properties.length} properties`
					);
				}

				query = args.lix.db
					.selectFrom(tableName as any)
					.select(foreignKey.references.properties[0] as any)
					.where(
						foreignKey.references.properties[0] as any,
						"=",
						localValues[0]
					);
			}
		} else {
			// Query JSON schema entities in the state table
			query = args.lix.db
				.selectFrom("state_all")
				.select("snapshot_content")
				.where("schema_key", "=", foreignKey.references.schemaKey);

			// Add WHERE conditions for each property
			for (let i = 0; i < foreignKey.properties.length; i++) {
				const refProperty = foreignKey.references.properties[i];
				const localValue = localValues[i];
				query = query.where(
					sql`json_extract(snapshot_content, '$.' || ${refProperty})`,
					"=",
					localValue
				);
			}
		}

		// Add version constraint if specified (only for regular schema entities)
		if (foreignKey.references.schemaVersion && !isSpecialEntity) {
			// Get stored schema with specific version
			const referencedSchema = executeSync({
				lix: args.lix,
				query: args.lix.db
					.selectFrom("stored_schema")
					.select("value")
					.where(
						sql`json_extract(value, '$.["x-lix-key"]')`,
						"=",
						foreignKey.references.schemaKey
					)
					.where(
						sql`json_extract(value, '$.["x-lix-version"]')`,
						"=",
						foreignKey.references.schemaVersion
					),
			});

			if (referencedSchema.length === 0) {
				throw new Error(
					`Foreign key constraint violation. Referenced schema '${foreignKey.references.schemaKey}' with version '${foreignKey.references.schemaVersion}' does not exist.`
				);
			}
		}

		const referencedStates = executeSync({
			lix: args.lix,
			query: isSpecialEntity
				? foreignKey.references.schemaKey === "state"
					? query
							.where("version_id", "=", args.version_id)
							.where("inherited_from_version_id", "is", null)
					: query
				: query
						.where("version_id", "=", args.version_id)
						.where("inherited_from_version_id", "is", null),
		});

		if (referencedStates.length === 0) {
			// Get version name for the error message
			const versionInfo = executeSync({
				lix: args.lix,
				query: args.lix.db
					.selectFrom("version")
					.select("name")
					.where("id", "=", args.version_id),
			});
			const versionName =
				versionInfo.length > 0 ? versionInfo[0].name : "unknown";

			// Build the property/value pairs for error message
			const localPropsStr = foreignKey.properties.join(", ");
			const refPropsStr = foreignKey.references.properties.join(", ");
			const valuesStr = localValues.map((v) => `'${v}'`).join(", ");

			// First line: compact string for regex matching (backwards compatibility)
			let errorMessage = `Foreign key constraint violation. The schema '${args.schema["x-lix-key"]}' (${args.schema["x-lix-version"]}) has a foreign key constraint on (${localPropsStr}) referencing '${foreignKey.references.schemaKey}.(${refPropsStr})' but no matching record exists with values (${valuesStr}) in version '${args.version_id}' (${versionName}).`;

			// Add foreign key relationship visualization
			errorMessage += `\n\nForeign Key Relationship:\n`;
			errorMessage += `  ${args.schema["x-lix-key"]}.(${localPropsStr}) → ${foreignKey.references.schemaKey}.(${refPropsStr})\n`;

			// Helper function to truncate property values
			const truncateValue = (value: any, maxLength: number = 40): string => {
				const str = typeof value === "string" ? value : JSON.stringify(value);
				return str.length > maxLength
					? str.substring(0, maxLength - 3) + "..."
					: str;
			};

			// Add entity being inserted section
			errorMessage += `\nEntity Being Inserted (${args.schema["x-lix-key"]}):\n`;
			errorMessage += `┌─────────────────┬──────────────────────────────────────────┐\n`;
			errorMessage += `│ Property        │ Value                                    │\n`;
			errorMessage += `├─────────────────┼──────────────────────────────────────────┤\n`;

			const content = args.snapshot_content as Record<string, any>;
			for (const [prop, value] of Object.entries(content)) {
				const propDisplay = prop.substring(0, 15).padEnd(15);
				const valueDisplay = truncateValue(value, 40).padEnd(40);
				errorMessage += `│ ${propDisplay} │ ${valueDisplay} │\n`;
			}
			errorMessage += `└─────────────────┴──────────────────────────────────────────┘\n`;

			// Add note about version-scoped behavior
			errorMessage += `\nNote: Foreign key constraints only validate entities that exist in the version context. Inherited entities from other versions cannot be referenced by foreign keys. If you reference global state, ensure that you are creating the entity in the global version.`;

			throw new Error(errorMessage);
		}

		// If this is a tracked entity, check if the referenced entity is untracked
		if (!args.untracked && !isSpecialEntity) {
			// Build query to check for untracked references
			let untrackedQuery = args.lix.db
				.selectFrom("state_all")
				.select("entity_id")
				.where("schema_key", "=", foreignKey.references.schemaKey)
				.where("version_id", "=", args.version_id)
				.where("untracked", "=", true);

			// Add WHERE conditions for each property
			for (let i = 0; i < foreignKey.properties.length; i++) {
				const refProperty = foreignKey.references.properties[i];
				const localValue = localValues[i];
				untrackedQuery = untrackedQuery.where(
					sql`json_extract(snapshot_content, '$.' || ${refProperty})`,
					"=",
					localValue
				);
			}

			const untrackedReferences = executeSync({
				lix: args.lix,
				query: untrackedQuery,
			});

			if (untrackedReferences.length > 0) {
				const refPropsStr = foreignKey.references.properties.join(", ");
				const valuesStr = localValues.map((v) => `'${v}'`).join(", ");

				let errorMessage = `Foreign key constraint violation: tracked entities cannot reference untracked entities. This would create broken references during sync.\n`;
				errorMessage += `\nThe tracked entity '${args.schema["x-lix-key"]}' is trying to reference an untracked entity '${foreignKey.references.schemaKey}' with (${refPropsStr})=(${valuesStr}).\n`;
				errorMessage += `\nUntracked entities are local-only and will not be synced to remote. If a tracked entity references an untracked entity, it would fail validation on the remote because the untracked entity doesn't exist there.\n`;
				errorMessage += `\nSolutions:\n`;
				errorMessage += `1. Make the referenced entity tracked (remove untracked flag)\n`;
				errorMessage += `2. Make the referencing entity untracked as well\n`;
				errorMessage += `3. Remove the foreign key reference`;

				throw new Error(errorMessage);
			}
		}
	}
}

function validateDeletionConstraints(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
	entity_id?: string;
	version_id: string;
}): void {
	if (!args.entity_id) {
		throw new Error("entity_id is required for delete operations");
	}

	// Get the current entity data to check what's being referenced
	// Check both direct entities and inherited entities
	const currentEntity = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("state_all")
			.select(["snapshot_content", "inherited_from_version_id", "version_id"])
			.where("entity_id", "=", args.entity_id)
			.where("schema_key", "=", args.schema["x-lix-key"])
			.where("version_id", "=", args.version_id),
	});

	if (currentEntity.length === 0) {
		// Enhanced error message for better copy-on-write deletion context
		let errorMessage = `Entity deletion failed. Cannot delete entity '${args.entity_id}' from schema '${args.schema["x-lix-key"]}' (${args.schema["x-lix-version"]}) in version '${args.version_id}' because the entity does not exist.`;

		// Add deletion context section
		errorMessage += `\n\nDeletion Context:\n`;
		errorMessage += `┌─────────────────┬──────────────────────────────────────┐\n`;
		errorMessage += `│ Property        │ Value                                │\n`;
		errorMessage += `├─────────────────┼──────────────────────────────────────┤\n`;
		errorMessage += `│ Entity ID       │ ${(args.entity_id || "undefined").substring(0, 36).padEnd(36)} │\n`;
		errorMessage += `│ Schema Key      │ ${args.schema["x-lix-key"].substring(0, 36).padEnd(36)} │\n`;
		errorMessage += `│ Schema Version  │ ${(args.schema["x-lix-version"] || "undefined").substring(0, 36).padEnd(36)} │\n`;
		errorMessage += `│ Version ID      │ ${args.version_id.substring(0, 36).padEnd(36)} │\n`;
		errorMessage += `└─────────────────┴──────────────────────────────────────┘\n`;

		// Check if entity exists in other versions
		const entityInOtherVersions = executeSync({
			lix: args.lix,
			query: args.lix.db
				.selectFrom("state_all")
				.select(["version_id", "snapshot_content", "inherited_from_version_id"])
				.where("entity_id", "=", args.entity_id)
				.where("schema_key", "=", args.schema["x-lix-key"]),
		});

		if (entityInOtherVersions.length > 0) {
			errorMessage += `\nEntity Search Results (${args.schema["x-lix-key"]}):\n`;
			errorMessage += `┌─────────────────────┬────────────────┬──────────────────────────────────────────┐\n`;
			errorMessage += `│ Version             │ Entity Found   │ Entity Content                           │\n`;
			errorMessage += `├─────────────────────┼────────────────┼──────────────────────────────────────────┤\n`;

			// Helper function to truncate property values
			const truncateValue = (value: any, maxLength: number = 40): string => {
				const str = typeof value === "string" ? value : JSON.stringify(value);
				return str.length > maxLength
					? str.substring(0, maxLength - 3) + "..."
					: str;
			};

			// Show current version first
			errorMessage += `│ ${args.version_id.substring(0, 19).padEnd(19)} │ ${"No".padEnd(14)} │ ${"-".padEnd(40)} │\n`;

			// Show other versions where entity exists
			for (const state of entityInOtherVersions) {
				if (state.version_id && state.version_id !== args.version_id) {
					const versionDisplay = state.version_id.substring(0, 19).padEnd(19);
					const contentDisplay = truncateValue(
						state.snapshot_content,
						40
					).padEnd(40);
					errorMessage += `│ ${versionDisplay} │ ${"Yes".padEnd(14)} │ ${contentDisplay} │\n`;
				}
			}

			errorMessage += `└─────────────────────┴────────────────┴──────────────────────────────────────────┘\n`;
			errorMessage += `\nThe entity exists in other version(s) but is not accessible in '${args.version_id}'. Check version inheritance configuration.`;
		} else {
			errorMessage += `\nThe entity with ID '${args.entity_id}' does not exist in any version for schema '${args.schema["x-lix-key"]}'.`;
		}

		throw new Error(errorMessage);
	}

	// Get all schemas to check which ones have foreign keys that might reference this entity
	const allSchemas = executeSync({
		lix: args.lix,
		query: args.lix.db.selectFrom("stored_schema").selectAll(),
	});

	// Check each schema for foreign keys that reference this entity's schema
	for (const storedSchema of allSchemas) {
		// Parse the JSON string value
		const schema =
			typeof storedSchema.value === "string"
				? (JSON.parse(storedSchema.value) as LixSchemaDefinition)
				: (storedSchema.value as LixSchemaDefinition);

		if (!schema["x-lix-foreign-keys"]) {
			continue;
		}

		// Check each foreign key in this schema
		const foreignKeys = schema["x-lix-foreign-keys"];
		if (!foreignKeys || !Array.isArray(foreignKeys)) {
			continue;
		}

		for (const foreignKey of foreignKeys) {
			// Skip if this foreign key doesn't reference our schema
			if (foreignKey.references.schemaKey !== args.schema["x-lix-key"]) {
				continue;
			}

			// Get the values of the properties that are being referenced
			const rawContent = currentEntity[0].snapshot_content;
			const entityContent =
				typeof rawContent === "string"
					? JSON.parse(rawContent)
					: (rawContent as any);

			// Extract referenced values
			const referencedValues: any[] = [];
			let hasNullValue = false;

			for (const refProperty of foreignKey.references.properties) {
				const value = entityContent[refProperty];
				if (value === null || value === undefined) {
					hasNullValue = true;
					break;
				}
				referencedValues.push(value);
			}

			if (hasNullValue) {
				continue;
			}

			// Build query to check if any entities reference these values
			let query = args.lix.db
				.selectFrom("state_all")
				.select("entity_id")
				.where("schema_key", "=", schema["x-lix-key"])
				.where("version_id", "=", args.version_id);

			// Add WHERE conditions for each property
			for (let i = 0; i < foreignKey.properties.length; i++) {
				const localProperty = foreignKey.properties[i];
				const referencedValue = referencedValues[i];
				query = query.where(
					sql`json_extract(snapshot_content, '$.' || ${localProperty})`,
					"=",
					referencedValue
				);
			}

			const referencingEntities = executeSync({
				lix: args.lix,
				query,
			});

			if (referencingEntities.length > 0) {
				const localPropsStr = foreignKey.properties.join(", ");
				throw new Error(
					`Foreign key constraint violation: Cannot delete entity because it is referenced by ${referencingEntities.length} record(s) in schema '${schema["x-lix-key"]}' via foreign key (${localPropsStr})`
				);
			}
		}
	}
}

/**
 * Parse JSON strings back to objects for properties defined as objects in the schema.
 * This is needed because when JSON objects are stored in SQLite, they get stringified,
 * but validation expects them to be actual objects.
 */
function parseJsonPropertiesInSnapshotContent(
	snapshotContent: any,
	schema: LixSchemaDefinition
): any {
	if (
		!(schema as any).properties ||
		typeof snapshotContent !== "object" ||
		snapshotContent === null
	) {
		return snapshotContent;
	}

	const parsed = { ...snapshotContent };

	// Check each property in the schema
	for (const [propertyName, propertySchema] of Object.entries(
		(schema as any).properties
	)) {
		const value = parsed[propertyName];

		// Skip if the value doesn't exist or is already an object
		if (value === undefined || value === null || typeof value === "object") {
			continue;
		}

		// Check if the property is defined as an object type in the schema
		if (
			typeof propertySchema === "object" &&
			propertySchema &&
			(propertySchema as any).type === "object"
		) {
			// Try to parse the JSON string
			if (typeof value === "string") {
				try {
					parsed[propertyName] = JSON.parse(value);
				} catch (error) {
					throw new Error(
						`Invalid JSON in property '${propertyName}': ${error instanceof Error ? error.message : String(error)}`
					);
				}
			}
		}

		// Check if the property is defined as a boolean type in the schema
		if (
			typeof propertySchema === "object" &&
			propertySchema &&
			(propertySchema as any).type === "boolean"
		) {
			// Convert SQLite's integer representation (0/1) to boolean
			if (typeof value === "number") {
				parsed[propertyName] = value === 1;
			}
		}
	}

	return parsed;
}

/**
 * Validates that adding a new edge to the commit graph won't create a cycle.
 * Uses depth-first search to detect cycles.
 */
function validateAcyclicCommitGraph(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	newEdge: { parent_id: string; child_id: string };
	version_id: string;
}): void {
	// Get all existing edges
	const existingEdges = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("commit_edge_all")
			.select(["parent_id", "child_id"])
			.where("lixcol_version_id", "=", args.version_id),
	});

	// Build adjacency list including the new edge
	const adjacencyList = new Map<string, string[]>();

	// Add existing edges
	for (const edge of existingEdges) {
		if (!adjacencyList.has(edge.parent_id)) {
			adjacencyList.set(edge.parent_id, []);
		}
		adjacencyList.get(edge.parent_id)!.push(edge.child_id);
	}

	// Add the new edge
	if (!adjacencyList.has(args.newEdge.parent_id)) {
		adjacencyList.set(args.newEdge.parent_id, []);
	}
	adjacencyList.get(args.newEdge.parent_id)!.push(args.newEdge.child_id);

	// DFS to detect cycles
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	function hasCycle(node: string, path: string[] = []): boolean {
		visited.add(node);
		recursionStack.add(node);
		path.push(node);

		const neighbors = adjacencyList.get(node) || [];
		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				if (hasCycle(neighbor, [...path])) {
					return true;
				}
			} else if (recursionStack.has(neighbor)) {
				// Found a cycle
				const cycleStart = path.indexOf(neighbor);
				const cyclePath = [...path.slice(cycleStart), neighbor];

				throw new Error(
					`Cycle detected in commit graph!\n` +
						`New edge: ${args.newEdge.parent_id} -> ${args.newEdge.child_id}\n` +
						`Cycle path: ${cyclePath.join(" -> ")}\n` +
						`Adding this edge would create a cycle in the graph.`
				);
			}
		}

		recursionStack.delete(node);
		return false;
	}

	// Check all nodes that haven't been visited
	for (const node of adjacencyList.keys()) {
		if (!visited.has(node)) {
			hasCycle(node);
		}
	}
}
