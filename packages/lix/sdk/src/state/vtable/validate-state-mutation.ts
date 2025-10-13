import { Ajv } from "ajv";
import type { LixEngine } from "../../engine/boot.js";
import {
	LixSchemaDefinition,
	type LixForeignKey,
} from "../../schema-definition/definition.js";
import {
	parseJsonPointer,
	parsePointerPaths,
	extractValueAtPath,
} from "../../schema-definition/json-pointer.js";
import { sql, type Kysely } from "kysely";
import type { LixChange } from "../../change/schema-definition.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { parse } from "@marcbachmann/cel-js";
import { getStoredSchema } from "../../stored-schema/get-stored-schema.js";
import { LixStoredSchemaSchema } from "../../stored-schema/schema-definition.js";

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
ajv.addFormat("json-pointer", {
	type: "string",
	validate: (value: string) => {
		try {
			parseJsonPointer(value);
			return true;
		} catch {
			return false;
		}
	},
});
ajv.addFormat("cel", {
	type: "string",
	validate: (value: string) => {
		try {
			parse(value);
			return true;
		} catch {
			return false;
		}
	},
});
const validateLixSchema = ajv.compile(LixSchemaDefinition);

const decodePointerSegment = (segment: string): string =>
	segment.replace(/~1/g, "/").replace(/~0/g, "~");

const normalizeSchemaPath = (value: string): string => {
	if (typeof value !== "string") {
		return "";
	}
	return value;
};

const normalizeSchemaPathArray = (
	values?: readonly string[] | string[]
): string[] => {
	if (!Array.isArray(values)) {
		return [];
	}
	return values
		.map((value) => normalizeSchemaPath(value))
		.filter((value): value is string => value.length > 0);
};

type NormalizedForeignKey = {
	properties: string[];
	references: {
		schemaKey: string;
		properties: string[];
		schemaVersion?: string;
	};
	mode?: "immediate" | "materialized";
};

const normalizeForeignKeys = (
	foreignKeys?: readonly LixForeignKey[] | LixForeignKey[]
): NormalizedForeignKey[] => {
	if (!Array.isArray(foreignKeys)) {
		return [];
	}
	return foreignKeys.map((foreignKey) => ({
		properties: normalizeSchemaPathArray(foreignKey.properties),
		references: {
			schemaKey: foreignKey.references.schemaKey,
			properties: normalizeSchemaPathArray(foreignKey.references.properties),
			schemaVersion: foreignKey.references.schemaVersion,
		},
		mode: foreignKey.mode,
	}));
};

export function validateStateMutation(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
	schema: LixSchemaDefinition | null;
	schemaKey?: string;
	snapshot_content: LixChange["snapshot_content"];
	operation: "insert" | "update" | "delete";
	entity_id?: string;
	version_id: string;
	untracked?: boolean;
}): void {
	// console.log(`validateStateMutation called with operation: ${args.operation}, schema: ${args.schema?.["x-lix-key"]}, entity_id: ${args.entity_id}`);
	// Validate version_id is provided

	if (!args.version_id) {
		throw new Error("version_id is required");
	}

	const existingVersion = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("version")
			.select("id")
			.where("id", "=", args.version_id)
			.compile()
	).rows;

	if (existingVersion.length === 0) {
		throw new Error(`Version with id '${args.version_id}' does not exist`);
	}

	let schemaKey =
		typeof args.schemaKey === "string" && args.schemaKey.length > 0
			? args.schemaKey
			: typeof args.schema?.["x-lix-key"] === "string" &&
				  args.schema["x-lix-key"].length > 0
				? (args.schema["x-lix-key"] as string)
				: undefined;

	let effectiveSchema = args.schema ?? null;

	if (schemaKey === LixStoredSchemaSchema["x-lix-key"]) {
		effectiveSchema ??= LixStoredSchemaSchema;
	} else if (schemaKey) {
		const storedSchema = getStoredSchema({
			engine: args.engine,
			key: schemaKey,
		});

		if (!storedSchema) {
			throw new Error(
				`Schema '${schemaKey}' is not stored. Store the schema before mutating state.`
			);
		}

		if (!effectiveSchema) {
			effectiveSchema = storedSchema;
		}

		const expectedVersion = storedSchema["x-lix-version"];
		const receivedVersion = effectiveSchema?.["x-lix-version"];
		if (
			typeof expectedVersion === "string" &&
			expectedVersion.length > 0 &&
			typeof receivedVersion === "string" &&
			receivedVersion.length > 0 &&
			expectedVersion !== receivedVersion
		) {
			throw new Error(
				`Stored schema '${schemaKey}' version mismatch. Expected '${expectedVersion}', received '${receivedVersion}'.`
			);
		}
	}

	if (!effectiveSchema) {
		throw new Error("Schema definition is required for state validation");
	}

	const isValidLixSchema = validateLixSchema(effectiveSchema);

	if (!isValidLixSchema) {
		throw new Error(
			`The provided schema is not a valid lix schema: ${ajv.errorsText(validateLixSchema.errors)}`
		);
	}

	const immutableFlag = effectiveSchema["x-lix-immutable"] === true;
	const normalizedSchemaKey =
		schemaKey ?? effectiveSchema["x-lix-key"] ?? "<unknown>";

	if (immutableFlag) {
		const immutableMessage = `Schema "${normalizedSchemaKey}" is immutable and cannot be updated.`;
		if (args.operation === "update") {
			throw new Error(immutableMessage);
		}
	}

	// Skip snapshot content validation for delete operations
	if (args.operation !== "delete") {
		// Parse JSON strings back to objects for properties defined as objects in the schema
		const parsedSnapshotContent = parseJsonPropertiesInSnapshotContent(
			args.snapshot_content,
			effectiveSchema
		);

		const isValidSnapshotContent = ajv.validate(
			effectiveSchema,
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
				`The provided snapshot content does not match the schema '${effectiveSchema["x-lix-key"]}' (${effectiveSchema["x-lix-version"]}).\n\n ${errorDetails || ajv.errorsText(ajv.errors)}`
			);
		}
	}

	// For deletion operations, validate foreign key references to prevent deletion
	if (args.operation === "delete") {
		validateDeletionConstraints({
			engine: args.engine,
			schema: effectiveSchema,
			entity_id: args.entity_id,
			version_id: args.version_id,
		});
	} else {
		if (effectiveSchema["x-lix-key"] === "lix_stored_schema") {
			validateStoredSchemaValue(args.snapshot_content);
		}
		// Validate primary key constraints (only for insert/update)
		if (effectiveSchema["x-lix-primary-key"]) {
			validatePrimaryKeyConstraints({
				engine: args.engine,
				schema: effectiveSchema,
				snapshot_content: args.snapshot_content,
				operation: args.operation,
				entity_id: args.entity_id,
				version_id: args.version_id,
			});
		}

		// Validate unique constraints (only for insert/update)
		if (effectiveSchema["x-lix-unique"]) {
			validateUniqueConstraints({
				engine: args.engine,
				schema: effectiveSchema,
				snapshot_content: args.snapshot_content,
				operation: args.operation,
				entity_id: args.entity_id,
				version_id: args.version_id,
			});
		}

		// Validate foreign key constraints (only for insert/update)
		if (effectiveSchema["x-lix-foreign-keys"]) {
			validateForeignKeyConstraints({
				engine: args.engine,
				schema: effectiveSchema,
				snapshot_content: args.snapshot_content,
				version_id: args.version_id,
				untracked: args.untracked,
			});
		}
	}

	// Hardcoded validation for commit_edge self-referencing
	if (effectiveSchema["x-lix-key"] === "lix_commit_edge") {
		const content = args.snapshot_content as any;
		if (content.parent_id === content.child_id) {
			throw new Error(
				"Self-referencing edges are not allowed: parent_id cannot equal child_id"
			);
		}

		// Check for cycles if lix_debug is enabled
		if (args.operation === "insert") {
			const debugEnabled = args.engine.executeSync(
				internalQueryBuilder
					.selectFrom("key_value_all")
					.select("value")
					.where("key", "=", "lix_debug")
					.where("value", "=", "true")
					.compile()
			).rows;

			if (debugEnabled.length > 0 && debugEnabled[0].value === "true") {
				validateAcyclicCommitGraph({
					engine: args.engine,
					newEdge: content,
					version_id: args.version_id,
				});
			}
		}
	}
}

function validateStoredSchemaValue(
	snapshot: LixChange["snapshot_content"]
): void {
	if (!snapshot || typeof snapshot !== "object") {
		throw new Error("Stored schema mutation requires a JSON object payload");
	}
	const payload = (snapshot as Record<string, unknown>).value;
	if (!payload || typeof payload !== "object") {
		throw new Error(
			"Stored schema mutation requires 'value' object in snapshot_content"
		);
	}
	const key = (payload as Record<string, unknown>)["x-lix-key"];
	if (typeof key !== "string" || key.length === 0) {
		throw new Error("value.x-lix-key must be a non-empty string");
	}
	const version = (payload as Record<string, unknown>)["x-lix-version"];
	if (typeof version !== "string" || version.length === 0) {
		throw new Error("value.x-lix-version must be string");
	}
}

function validatePrimaryKeyConstraints(args: {
	engine: Pick<LixEngine, "executeSync">;
	schema: LixSchemaDefinition;
	snapshot_content: LixChange["snapshot_content"];
	operation: "insert" | "update" | "delete";
	entity_id?: string;
	version_id: string;
}): void {
	const primaryKeyPaths = parsePointerPaths(args.schema["x-lix-primary-key"]);
	if (primaryKeyPaths.length === 0) {
		return;
	}

	// Extract primary key values from the snapshot content
	const primaryKeyValues: any[] = [];
	for (const path of primaryKeyPaths) {
		const value = extractValueAtPath(args.snapshot_content, path.segments);
		if (value === undefined || value === null) {
			throw new Error(
				`Primary key field '${path.label}' cannot be null or undefined`
			);
		}
		primaryKeyValues.push(value);
	}

	// Query existing resolved state (including cache/untracked/inherited) to check for duplicates,
	// but ignore transaction rows (tag 'T' in _pk) so that multiple inserts within the same
	// transaction can overwrite without tripping PK validation.
	const db =
		internalQueryBuilder as unknown as Kysely<LixInternalDatabaseSchema>;
	let query = db
		.selectFrom("lix_internal_state_vtable")
		.select(["snapshot_content"])
		.where("schema_key", "=", args.schema["x-lix-key"]);

	// Constrain by version – lix_internal_state_vtable exposes child version_id directly
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
	for (let i = 0; i < primaryKeyPaths.length; i++) {
		const path = primaryKeyPaths[i]!;
		const value = primaryKeyValues[i]!;
		const jsonPathExpr = sql.raw(
			`json_extract(snapshot_content, '${path.jsonPath}')`
		);
		query = query.where(jsonPathExpr as any, "=", value);
	}

	const existingStates = args.engine.executeSync(query.compile()).rows;

	if (existingStates.length > 0) {
		const fieldNames = primaryKeyPaths.map((path) => path.label).join(", ");
		const fieldValues = primaryKeyValues.map((v) => `'${v}'`).join(", ");

		throw new Error(
			`Primary key constraint violation: The primary key constraint on (${fieldNames}) is violated by values (${fieldValues})`
		);
	}
}

function validateUniqueConstraints(args: {
	engine: Pick<LixEngine, "executeSync">;
	schema: LixSchemaDefinition;
	snapshot_content: LixChange["snapshot_content"];
	operation: "insert" | "update" | "delete";
	entity_id?: string;
	version_id: string;
}): void {
	const uniqueConstraints = (args.schema["x-lix-unique"] ?? [])
		.map((group) => parsePointerPaths(group))
		.filter((group) => group.length > 0);
	if (uniqueConstraints.length === 0) {
		return;
	}

	// Validate each unique constraint
	for (const uniquePaths of uniqueConstraints) {
		if (!uniquePaths || uniquePaths.length === 0) {
			continue;
		}

		// Extract values for this unique constraint
		const uniqueValues: any[] = [];
		for (const path of uniquePaths) {
			const value = extractValueAtPath(args.snapshot_content, path.segments);
			if (value === undefined || value === null) {
				// Skip unique constraint validation if any field is null/undefined
				// This allows nullable unique fields (like SQL UNIQUE constraints)
				continue;
			}
			uniqueValues.push(value);
		}

		// If we didn't get all values (some were null), skip this constraint
		if (uniqueValues.length !== uniquePaths.length) {
			continue;
		}

		// Query existing resolved state for duplicates, excluding transaction-state rows (tag 'T')
		const db =
			internalQueryBuilder as unknown as Kysely<LixInternalDatabaseSchema>;
		let query = db
			.selectFrom("lix_internal_state_vtable")
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
		for (let i = 0; i < uniquePaths.length; i++) {
			const path = uniquePaths[i]!;
			const value = uniqueValues[i]!;
			const jsonExpr = sql.raw(
				`json_extract(snapshot_content, '${path.jsonPath}')`
			);
			query = query.where(jsonExpr as any, "=", value);
		}

		const existingStates = args.engine.executeSync(query.compile()).rows;

		if (existingStates.length > 0) {
			const fieldNames = uniquePaths.map((path) => path.label).join(", ");
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
	engine: Pick<LixEngine, "executeSync">;
	schema: LixSchemaDefinition;
	snapshot_content: LixChange["snapshot_content"];
	version_id: string;
	untracked?: boolean;
}): void {
	const foreignKeys = normalizeForeignKeys(args.schema["x-lix-foreign-keys"]);
	if (foreignKeys.length === 0) {
		return;
	}

	// Validate each foreign key constraint
	for (const foreignKey of foreignKeys) {
		const localPaths = parsePointerPaths(foreignKey.properties);
		const refPaths = parsePointerPaths(foreignKey.references.properties);
		// Validation mode: default to immediate
		const mode = foreignKey.mode ?? "immediate";
		// Validate that properties arrays have same length
		if (
			localPaths.length !== refPaths.length ||
			localPaths.length !== foreignKey.properties.length
		) {
			throw new Error(
				`Foreign key constraint error: Local properties (${localPaths
					.map((path) => path.label)
					.join(", ")}) and referenced properties (${refPaths
					.map((path) => path.label)
					.join(", ")}) must have the same length`
			);
		}

		// In materialized mode we skip insert/update existence checks entirely.
		// Delete-time checks are handled in validateDeletionConstraints by reverse lookup.
		if (mode === "materialized") {
			continue;
		}

		// Extract values for all local properties
		const localValues: any[] = [];
		let hasNullValue = false;

		for (const path of localPaths) {
			const value = extractValueAtPath(args.snapshot_content, path.segments);
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
				query = internalQueryBuilder
					.selectFrom("state_all" as any)
					.select(refPaths.map((path) => path.segments[0]) as any);

				// Add WHERE conditions for each property
				for (let i = 0; i < localPaths.length; i++) {
					const refPath = refPaths[i]!;
					if (refPath.segments.length !== 1) {
						throw new Error(
							`Foreign key constraint error: state references require direct column names, received '${refPath.label}'`
						);
					}
					const localValue = localValues[i]!;
					query = query.where(refPath.segments[0] as any, "=", localValue);
				}
			} else {
				// For other special entities, we only support single property references
				if (localPaths.length !== 1 || refPaths.length !== 1) {
					throw new Error(
						`Foreign key constraint error: Special entity '${foreignKey.references.schemaKey}' references only support single property, ` +
							`but got ${localPaths.length} properties`
					);
				}

				query = internalQueryBuilder
					.selectFrom(tableName as any)
					.select(refPaths[0]!.segments[0] as any)
					.where(refPaths[0]!.segments[0] as any, "=", localValues[0]);
			}
		} else {
			// Query JSON schema entities in the state table
			query = internalQueryBuilder
				.selectFrom("state_all")
				.select("snapshot_content")
				.where("schema_key", "=", foreignKey.references.schemaKey);

			// Add WHERE conditions for each property
			for (let i = 0; i < localPaths.length; i++) {
				const refPath = refPaths[i]!;
				const localValue = localValues[i]!;
				const columnExpr = sql.raw(
					`json_extract(snapshot_content, '${refPath.jsonPath}')`
				);
				query = query.where(columnExpr as any, "=", localValue);
			}
		}

		// Add version constraint if specified (only for regular schema entities)
		if (foreignKey.references.schemaVersion && !isSpecialEntity) {
			// Get stored schema with specific version
			const referencedSchema = args.engine.executeSync(
				internalQueryBuilder
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
					)
					.compile()
			).rows;

			if (referencedSchema.length === 0) {
				throw new Error(
					`Foreign key constraint violation. Referenced schema '${foreignKey.references.schemaKey}' with version '${foreignKey.references.schemaVersion}' does not exist.`
				);
			}
		}

		const referencedStates = args.engine.executeSync(
			(isSpecialEntity
				? foreignKey.references.schemaKey === "state"
					? query
							.where("version_id", "=", args.version_id)
							.where("inherited_from_version_id", "is", null)
					: query
				: query
						.where("version_id", "=", args.version_id)
						.where("inherited_from_version_id", "is", null)
			).compile()
		).rows;

		if (referencedStates.length === 0) {
			// Get version name for the error message
			const versionInfo = args.engine.executeSync(
				internalQueryBuilder
					.selectFrom("version")
					.select("name")
					.where("id", "=", args.version_id)
					.compile()
			).rows;
			const versionName =
				versionInfo.length > 0 ? versionInfo[0].name : "unknown";

			// Build the property/value pairs for error message
			const localPropsStr = localPaths.map((path) => path.label).join(", ");
			const refPropsStr = refPaths.map((path) => path.label).join(", ");
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
			let untrackedQuery = internalQueryBuilder
				.selectFrom("state_all")
				.select("entity_id")
				.where("schema_key", "=", foreignKey.references.schemaKey)
				.where("version_id", "=", args.version_id)
				.where("untracked", "=", true);

			// Add WHERE conditions for each property
			for (let i = 0; i < localPaths.length; i++) {
				const refPath = refPaths[i]!;
				const localValue = localValues[i]!;
				const expr = sql.raw(
					`json_extract(snapshot_content, '${refPath.jsonPath}')`
				);
				untrackedQuery = untrackedQuery.where(expr as any, "=", localValue);
			}

			const untrackedReferences = args.engine.executeSync(
				untrackedQuery.compile()
			).rows;

			if (untrackedReferences.length > 0) {
				const refPropsStr = refPaths.map((path) => path.label).join(", ");
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
	engine: Pick<LixEngine, "executeSync">;
	schema: LixSchemaDefinition;
	entity_id?: string;
	version_id: string;
}): void {
	if (!args.entity_id) {
		throw new Error("entity_id is required for delete operations");
	}

	// Get the current entity data to check what's being referenced
	// Check both direct entities and inherited entities
	const currentEntity = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("state_all")
			.select(["snapshot_content", "inherited_from_version_id", "version_id"])
			.where("entity_id", "=", args.entity_id)
			.where("schema_key", "=", args.schema["x-lix-key"])
			.where("version_id", "=", args.version_id)
			.compile()
	).rows;

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
		const entityInOtherVersions = args.engine.executeSync(
			internalQueryBuilder
				.selectFrom("state_all")
				.select(["version_id", "snapshot_content", "inherited_from_version_id"])
				.where("entity_id", "=", args.entity_id)
				.where("schema_key", "=", args.schema["x-lix-key"])
				.compile()
		).rows;

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
	const allSchemas = args.engine.executeSync(
		internalQueryBuilder.selectFrom("stored_schema").selectAll().compile()
	).rows;

	// Check each schema for foreign keys that reference this entity's schema
	for (const storedSchema of allSchemas) {
		// Parse the JSON string value
		const schema =
			typeof storedSchema.value === "string"
				? (JSON.parse(storedSchema.value) as LixSchemaDefinition)
				: (storedSchema.value as LixSchemaDefinition);

		const foreignKeys = normalizeForeignKeys(schema["x-lix-foreign-keys"]);
		if (foreignKeys.length === 0) {
			continue;
		}

		for (const foreignKey of foreignKeys) {
			const localPaths = parsePointerPaths(foreignKey.properties);
			const refPaths = parsePointerPaths(foreignKey.references.properties);
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

			for (const refPath of refPaths) {
				const value = extractValueAtPath(entityContent, refPath.segments);
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
			let query = internalQueryBuilder
				.selectFrom("state_all")
				.select("entity_id")
				.where("schema_key", "=", schema["x-lix-key"])
				.where("version_id", "=", args.version_id);

			// Add WHERE conditions for each property
			for (let i = 0; i < localPaths.length; i++) {
				const localPath = localPaths[i]!;
				const referencedValue = referencedValues[i]!;
				const expr = sql.raw(
					`json_extract(snapshot_content, '${localPath.jsonPath}')`
				);
				query = query.where(expr as any, "=", referencedValue);
			}

			const referencingEntities = args.engine.executeSync(query.compile()).rows;

			if (referencingEntities.length > 0) {
				const localPropsStr = localPaths.map((path) => path.label).join(", ");
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
	engine: Pick<LixEngine, "executeSync">;
	newEdge: { parent_id: string; child_id: string };
	version_id: string;
}): void {
	// Get all existing edges
	const existingEdges = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("commit_edge_all")
			.select(["parent_id", "child_id"])
			.where("lixcol_version_id", "=", args.version_id)
			.compile()
	).rows;

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
