import { Ajv } from "ajv";
import type { Lix } from "../lix/open-lix.js";
import { LixSchemaDefinition } from "../schema-definition/definition.js";
import { executeSync } from "../database/execute-sync.js";
import { sql } from "kysely";
import type { Change } from "../change/schema.js";

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
	snapshot_content: Change["snapshot_content"];
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

	// Hardcoded validation for change_set_edge self-referencing
	if (args.schema["x-lix-key"] === "lix_change_set_edge") {
		const content = args.snapshot_content as any;
		if (content.parent_id === content.child_id) {
			throw new Error(
				"Self-referencing edges are not allowed: parent_id cannot equal child_id"
			);
		}
	}
}

function validatePrimaryKeyConstraints(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
	snapshot_content: Change["snapshot_content"];
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

	// Query existing state to check for duplicates
	let query = args.lix.db
		.selectFrom("state_all")
		.select("snapshot_content")
		.where("schema_key", "=", args.schema["x-lix-key"])
		.where("version_id", "=", args.version_id);

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
	snapshot_content: Change["snapshot_content"];
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

		// Query existing state to check for duplicates
		let query = args.lix.db
			.selectFrom("state_all")
			.select("snapshot_content")
			.where("schema_key", "=", args.schema["x-lix-key"])
			.where("version_id", "=", args.version_id);

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
	snapshot_content: Change["snapshot_content"];
	version_id: string;
	untracked?: boolean;
}): void {
	const foreignKeys = args.schema["x-lix-foreign-keys"];
	if (!foreignKeys) {
		return;
	}

	// Validate each foreign key constraint
	for (const [localProperty, foreignKeyDef] of Object.entries(foreignKeys)) {
		const foreignKeyValue = (args.snapshot_content as any)[localProperty];

		// Skip validation if foreign key value is null or undefined
		// (like SQL foreign keys, null values are allowed)
		if (foreignKeyValue === null || foreignKeyValue === undefined) {
			continue;
		}

		// Check if this references a real SQL table vs a JSON schema entity
		const isRealSqlTable = ["lix_change"].includes(foreignKeyDef.schemaKey);

		let query: any;
		if (isRealSqlTable) {
			// Query the real SQL table directly
			// Map schema key to actual table name
			const tableName =
				foreignKeyDef.schemaKey === "lix_change"
					? "change"
					: foreignKeyDef.schemaKey;
			query = args.lix.db
				.selectFrom(tableName as any)
				.select(foreignKeyDef.property as any)
				.where(foreignKeyDef.property as any, "=", foreignKeyValue);
		} else {
			// Query JSON schema entities in the state table
			query = args.lix.db
				.selectFrom("state_all")
				.select("snapshot_content")
				.where("schema_key", "=", foreignKeyDef.schemaKey)
				.where(
					sql`json_extract(snapshot_content, '$.' || ${foreignKeyDef.property})`,
					"=",
					foreignKeyValue
				);
		}

		// Add version constraint if specified (only for JSON schema entities)
		if (foreignKeyDef.schemaVersion && !isRealSqlTable) {
			// Get stored schema with specific version
			const referencedSchema = executeSync({
				lix: args.lix,
				query: args.lix.db
					.selectFrom("stored_schema")
					.select("value")
					.where(
						sql`json_extract(value, '$.["x-lix-key"]')`,
						"=",
						foreignKeyDef.schemaKey
					)
					.where(
						sql`json_extract(value, '$.["x-lix-version"]')`,
						"=",
						foreignKeyDef.schemaVersion
					),
			});

			if (referencedSchema.length === 0) {
				throw new Error(
					`Foreign key constraint violation. Referenced schema '${foreignKeyDef.schemaKey}' with version '${foreignKeyDef.schemaVersion}' does not exist.`
				);
			}
		}

		const referencedStates = executeSync({
			lix: args.lix,
			query: isRealSqlTable
				? query
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

			// First line: compact string for regex matching (backwards compatibility)
			let errorMessage = `Foreign key constraint violation. The schema '${args.schema["x-lix-key"]}' (${args.schema["x-lix-version"]}) has a foreign key constraint on '${localProperty}' referencing '${foreignKeyDef.schemaKey}.${foreignKeyDef.property}' but no matching record exists with value '${foreignKeyValue}' in version '${args.version_id}' (${versionName}).`;

			// Add foreign key relationship visualization
			errorMessage += `\n\nForeign Key Relationship:\n`;
			errorMessage += `  ${args.schema["x-lix-key"]}.${localProperty} → ${foreignKeyDef.schemaKey}.${foreignKeyDef.property}\n`;

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
		if (!args.untracked && !isRealSqlTable) {
			// Query the untracked table to see if the referenced entity is untracked
			const untrackedReferences = executeSync({
				lix: args.lix,
				query: args.lix.db
					.selectFrom("state_all")
					.select("entity_id")
					.where("schema_key", "=", foreignKeyDef.schemaKey)
					.where("version_id", "=", args.version_id)
					.where("untracked", "=", true)
					.where(
						sql`json_extract(snapshot_content, '$.' || ${foreignKeyDef.property})`,
						"=",
						foreignKeyValue
					),
			});

			if (untrackedReferences.length > 0) {
				let errorMessage = `Foreign key constraint violation: tracked entities cannot reference untracked entities. This would create broken references during sync.\n`;
				errorMessage += `\nThe tracked entity '${args.schema["x-lix-key"]}' is trying to reference an untracked entity '${foreignKeyDef.schemaKey}' with ${foreignKeyDef.property}='${foreignKeyValue}'.\n`;
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
		for (const [localProperty, foreignKeyDef] of Object.entries(
			schema["x-lix-foreign-keys"]
		)) {
			// Skip if this foreign key doesn't reference our schema
			if (foreignKeyDef.schemaKey !== args.schema["x-lix-key"]) {
				continue;
			}

			// Get the value of the property that is being referenced
			const rawContent = currentEntity[0].snapshot_content;
			const entityContent =
				typeof rawContent === "string"
					? JSON.parse(rawContent)
					: (rawContent as any);
			const referencedValue = entityContent[foreignKeyDef.property];

			if (referencedValue === null || referencedValue === undefined) {
				continue;
			}

			// Check if any entities reference this value
			const referencingEntities = executeSync({
				lix: args.lix,
				query: args.lix.db
					.selectFrom("state_all")
					.select("entity_id")
					.where("schema_key", "=", schema["x-lix-key"])
					.where("version_id", "=", args.version_id)
					.where(
						sql`json_extract(snapshot_content, '$.' || ${localProperty})`,
						"=",
						referencedValue
					),
			});

			if (referencingEntities.length > 0) {
				// Helper function to truncate property values
				const truncateValue = (value: any, maxLength: number = 40): string => {
					const str = typeof value === "string" ? value : JSON.stringify(value);
					return str.length > maxLength
						? str.substring(0, maxLength - 3) + "..."
						: str;
				};

				// Get the entity being deleted for display
				const rawContent = currentEntity[0].snapshot_content;
				const entityContent =
					typeof rawContent === "string"
						? JSON.parse(rawContent)
						: (rawContent as any);

				// Get a sample referencing entity for display
				const sampleReferencingEntity = executeSync({
					lix: args.lix,
					query: args.lix.db
						.selectFrom("state_all")
						.selectAll()
						.where("schema_key", "=", schema["x-lix-key"])
						.where("version_id", "=", args.version_id)
						.where(
							sql`json_extract(snapshot_content, '$.' || ${localProperty})`,
							"=",
							referencedValue
						)
						.limit(1),
				});

				let errorMessage = `Foreign key constraint violation: Cannot delete entity '${args.entity_id}' from schema '${args.schema["x-lix-key"]}' because it is referenced by ${referencingEntities.length} record(s) in schema '${schema["x-lix-key"]}'.`;

				// Add relationship visualization
				errorMessage += `\n\nForeign Key Relationship:\n`;
				errorMessage += `  ${schema["x-lix-key"]}.${localProperty} → ${args.schema["x-lix-key"]}.${foreignKeyDef.property}\n`;

				// Show entity being deleted
				errorMessage += `\nEntity Being Deleted (${args.schema["x-lix-key"]}):\n`;
				errorMessage += `┌─────────────────┬──────────────────────────────────────────┐\n`;
				errorMessage += `│ Property        │ Value                                    │\n`;
				errorMessage += `├─────────────────┼──────────────────────────────────────────┤\n`;
				
				// Show key properties of the entity being deleted
				const entityKeys = Object.keys(entityContent).slice(0, 3); // Show first 3 properties
				for (const key of entityKeys) {
					const displayKey = key.substring(0, 15).padEnd(15);
					const displayValue = truncateValue(entityContent[key], 40).padEnd(40);
					errorMessage += `│ ${displayKey} │ ${displayValue} │\n`;
				}
				errorMessage += `└─────────────────┴──────────────────────────────────────────┘\n`;

				// Show sample referencing record
				if (sampleReferencingEntity.length > 0) {
					const referencingContent = typeof sampleReferencingEntity[0].snapshot_content === "string"
						? JSON.parse(sampleReferencingEntity[0].snapshot_content)
						: sampleReferencingEntity[0].snapshot_content;

					errorMessage += `\nReferencing Records (${schema["x-lix-key"]}):\n`;
					errorMessage += `┌─────────────────┬──────────────────────────────────────────┐\n`;
					errorMessage += `│ Property        │ Value                                    │\n`;
					errorMessage += `├─────────────────┼──────────────────────────────────────────┤\n`;
					
					// Show the foreign key property and a few other key properties
					const refKeys = [localProperty, ...Object.keys(referencingContent).filter(k => k !== localProperty).slice(0, 2)];
					for (const key of refKeys) {
						const displayKey = key.substring(0, 15).padEnd(15);
						const displayValue = truncateValue(referencingContent[key], 40).padEnd(40);
						errorMessage += `│ ${displayKey} │ ${displayValue} │\n`;
					}
					errorMessage += `└─────────────────┴──────────────────────────────────────────┘\n`;

					if (referencingEntities.length > 1) {
						errorMessage += `\n(${referencingEntities.length - 1} additional referencing record(s) not shown)\n`;
					}
				}

				// Add resolution guidance
				errorMessage += `\nTo resolve this constraint violation:\n`;
				errorMessage += `• Delete or update the referencing records first\n`;
				errorMessage += `• Or modify the foreign key constraint to CASCADE deletes`;

				throw new Error(errorMessage);
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
