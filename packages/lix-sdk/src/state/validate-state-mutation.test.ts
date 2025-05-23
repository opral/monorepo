import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { validateStateMutation } from "./validate-state-mutation.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { sql } from "kysely";
import { createVersion } from "../version/create-version.js";

test("throws if the schema is not a valid lix schema", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
		// @ts-expect-error - x-version is missing
	} as const satisfies LixSchemaDefinition;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(() =>
		validateStateMutation({
			lix,
			// @ts-expect-error - x-key is missing
			schema,
			snapshot_content: {},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError();
});

test("inserts the version and active version schemas to enable validation", async () => {
	const lix = await openLixInMemory({});

	const result = await lix.db
		.selectFrom("stored_schema")
		.where("key", "in", ["lix_version", "lix_active_version"])
		.selectAll()
		.execute();

	expect(result.length).toBeGreaterThan(0);
});

test("valid lix schema with a valid snapshot passes", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const snapshot = {
		content: {
			name: "John",
		},
	};

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: snapshot.content,
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();
});

test("an invalid snapshot fails", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const snapshot = {
		content: {
			foo: "John",
		},
	};

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: snapshot.content,
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError();
});

test("passes when primary key is unique", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user",
		"x-lix-primary-key": ["id"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const snapshot = {
		content: {
			id: "user1",
			name: "John",
		},
	};

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: snapshot.content,
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();
});

test("throws when primary key violates uniqueness constraint", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user",
		"x-lix-primary-key": ["id"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema first
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	// Insert first user into state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "user1",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: { id: "user1", name: "John" },
		})
		.execute();

	// Try to insert another user with same primary key
	const duplicateSnapshot = {
		content: {
			id: "user1",
			name: "Jane",
		},
	};

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: duplicateSnapshot.content,
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Primary key constraint violation");
});

test("handles composite primary keys", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user_role",
		"x-lix-primary-key": ["user_id", "role_id"],
		properties: {
			user_id: { type: "string" },
			role_id: { type: "string" },
			assigned_date: { type: "string" },
		},
		required: ["user_id", "role_id", "assigned_date"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema first
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	// Insert first user-role into state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "user_role1",
			file_id: "file1",
			schema_key: "user_role",
			plugin_key: "test_plugin",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: {
				user_id: "user1",
				role_id: "admin",
				assigned_date: "2024-01-01",
			},
		})
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should pass (different composite key)
	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: {
				user_id: "user1",
				role_id: "editor",
				assigned_date: "2024-01-02",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should fail (same composite key)
	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: {
				user_id: "user1",
				role_id: "admin",
				assigned_date: "2024-01-03",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Primary key constraint violation");
});

test("passes when unique constraint is satisfied", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user",
		"x-lix-primary-key": ["id"],
		"x-lix-unique": [["email"], ["username"]],
		properties: {
			id: { type: "string" },
			email: { type: "string" },
			username: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "email", "username", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const snapshot = {
		content: {
			id: "user1",
			email: "john@example.com",
			username: "john_doe",
			name: "John Doe",
		},
	};

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: snapshot.content,
			version_id: activeVersion.version_id,
			operation: "insert",
		})
	).not.toThrowError();
});

test("throws when single field unique constraint is violated", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user",
		"x-lix-primary-key": ["id"],
		"x-lix-unique": [["email"], ["username"]],
		properties: {
			id: { type: "string" },
			email: { type: "string" },
			username: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "email", "username", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema first
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	// Insert first user into state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "user1",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: {
				id: "user1",
				email: "john@example.com",
				username: "john_doe",
				name: "John Doe",
			},
		})
		.execute();

	// Try to insert another user with same email (unique constraint violation)
	const duplicateEmailSnapshot = {
		content: {
			id: "user2",
			email: "john@example.com", // Same email
			username: "jane_doe",
			name: "Jane Doe",
		},
	};

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: duplicateEmailSnapshot.content,
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Unique constraint violation");

	// Try to insert another user with same username (unique constraint violation)
	const duplicateUsernameSnapshot = {
		content: {
			id: "user3",
			email: "jane@example.com",
			username: "john_doe", // Same username
			name: "Jane Smith",
		},
	};

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: duplicateUsernameSnapshot.content,
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Unique constraint violation");
});

test("handles composite unique constraints", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "product",
		"x-lix-primary-key": ["id"],
		"x-lix-unique": [
			["category", "name"], // Composite unique constraint
			["sku"], // Single field unique constraint
		],
		properties: {
			id: { type: "string" },
			category: { type: "string" },
			name: { type: "string" },
			sku: { type: "string" },
			price: { type: "number" },
		},
		required: ["id", "category", "name", "sku", "price"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema first
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	// Insert first product into state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "product1",
			file_id: "file1",
			schema_key: "product",
			plugin_key: "test_plugin",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: {
				id: "product1",
				category: "electronics",
				name: "Laptop",
				sku: "ELEC-LAP-001",
				price: 999.99,
			},
		})
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should pass (different composite unique key)
	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: {
				id: "product2",
				category: "electronics",
				name: "Desktop", // Different name in same category
				sku: "ELEC-DES-001",
				price: 1299.99,
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should pass (same name in different category)
	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: {
				id: "product3",
				category: "furniture", // Different category
				name: "Laptop", // Same name but different category
				sku: "FURN-LAP-001",
				price: 599.99,
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should fail (same composite unique key: category + name)
	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: {
				id: "product4",
				category: "electronics",
				name: "Laptop", // Same category + name combination
				sku: "ELEC-LAP-002",
				price: 899.99,
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Unique constraint violation");

	// This should fail (same SKU)
	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: {
				id: "product5",
				category: "accessories",
				name: "Mouse",
				sku: "ELEC-LAP-001", // Same SKU
				price: 29.99,
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Unique constraint violation");
});

test("passes when foreign key references exist", async () => {
	const lix = await openLixInMemory({});

	const userSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user",
		"x-lix-primary-key": ["id"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const postSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "post",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": {
			author_id: {
				schemaKey: "user",
				property: "id",
			},
		},
		properties: {
			id: { type: "string" },
			author_id: { type: "string" },
			title: { type: "string" },
		},
		required: ["id", "author_id", "title"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store schemas
	await lix.db
		.insertInto("stored_schema")
		.values([{ value: userSchema }, { value: postSchema }])
		.execute();

	// Insert a user that will be referenced
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "user1",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: {
				id: "user1",
				name: "John Doe",
			},
		})
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should pass - foreign key reference exists
	expect(() =>
		validateStateMutation({
			lix,
			schema: postSchema,
			snapshot_content: {
				id: "post1",
				author_id: "user1",
				title: "My First Post",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();
});

test("throws when foreign key reference does not exist", async () => {
	const lix = await openLixInMemory({});

	const userSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user",
		"x-lix-primary-key": ["id"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const postSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "post",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": {
			author_id: {
				schemaKey: "user",
				property: "id",
			},
		},
		properties: {
			id: { type: "string" },
			author_id: { type: "string" },
			title: { type: "string" },
		},
		required: ["id", "author_id", "title"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store schemas
	await lix.db
		.insertInto("stored_schema")
		.values([{ value: userSchema }, { value: postSchema }])
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should fail - foreign key reference does not exist
	expect(() =>
		validateStateMutation({
			lix,
			schema: postSchema,
			snapshot_content: {
				id: "post1",
				author_id: "nonexistent_user",
				title: "My First Post",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Foreign key constraint violation");
});

test("handles multiple foreign keys", async () => {
	const lix = await openLixInMemory({});

	const userSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user",
		"x-lix-primary-key": ["id"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const categorySchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "category",
		"x-lix-primary-key": ["id"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const postSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "post",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": {
			author_id: {
				schemaKey: "user",
				property: "id",
			},
			category_id: {
				schemaKey: "category",
				property: "id",
			},
		},
		properties: {
			id: { type: "string" },
			author_id: { type: "string" },
			category_id: { type: "string" },
			title: { type: "string" },
		},
		required: ["id", "author_id", "category_id", "title"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store schemas
	await lix.db
		.insertInto("stored_schema")
		.values([
			{ value: userSchema },
			{ value: categorySchema },
			{ value: postSchema },
		])
		.execute();

	// Insert referenced entities
	await lix.db
		.insertInto("state")
		.values([
			{
				entity_id: "user1",
				file_id: "file1",
				schema_key: "user",
				plugin_key: "test_plugin",
				version_id: lix.db.selectFrom("active_version").select("version_id"),
				snapshot_content: {
					id: "user1",
					name: "John Doe",
				},
			},
			{
				entity_id: "category1",
				file_id: "file1",
				schema_key: "category",
				plugin_key: "test_plugin",
				version_id: lix.db.selectFrom("active_version").select("version_id"),
				snapshot_content: {
					id: "category1",
					name: "Technology",
				},
			},
		])
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should pass - all foreign key references exist
	expect(() =>
		validateStateMutation({
			lix,
			schema: postSchema,
			snapshot_content: {
				id: "post1",
				author_id: "user1",
				category_id: "category1",
				title: "My Tech Post",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should fail - category reference does not exist
	expect(() =>
		validateStateMutation({
			lix,
			schema: postSchema,
			snapshot_content: {
				id: "post2",
				author_id: "user1",
				category_id: "nonexistent_category",
				title: "Another Post",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Foreign key constraint violation");
});

test("allows null foreign key values", async () => {
	const lix = await openLixInMemory({});

	const userSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user",
		"x-lix-primary-key": ["id"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const postSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "post",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": {
			author_id: {
				schemaKey: "user",
				property: "id",
			},
		},
		properties: {
			id: { type: "string" },
			author_id: { type: ["string", "null"] },
			title: { type: "string" },
		},
		required: ["id", "title"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store schemas
	await lix.db
		.insertInto("stored_schema")
		.values([{ value: userSchema }, { value: postSchema }])
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should pass - null foreign key is allowed
	expect(() =>
		validateStateMutation({
			lix,
			schema: postSchema,
			snapshot_content: {
				id: "post1",
				author_id: null,
				title: "Anonymous Post",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should also pass - undefined foreign key (when not required)
	expect(() =>
		validateStateMutation({
			lix,
			schema: postSchema,
			snapshot_content: {
				id: "post2",
				title: "Another Anonymous Post",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();
});

test("foreign key referencing real SQL table (change.id)", async () => {
	const lix = await openLixInMemory({});

	// Insert a real change record into the change table
	await lix.db
		// @ts-expect-error - internal_snapshot is not a public table
		.insertInto("internal_snapshot")
		.values({
			id: "snap1",
			content: sql`jsonb(${JSON.stringify({ id: "entity1" })})`,
		})
		.execute();

	await lix.db
		// @ts-expect-error - internal_change is not a public table
		.insertInto("internal_change")
		.values({
			id: "change1",
			entity_id: "entity1",
			plugin_key: "test_plugin",
			schema_key: "test_schema",
			file_id: "file1",
			snapshot_id: "snap1",
		})
		.execute();

	const changeSetElementSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "change_set_element_test",
		"x-lix-foreign-keys": {
			change_id: {
				schemaKey: "lix_change",
				property: "id",
			},
		},
		properties: {
			id: { type: "string" },
			change_id: { type: "string" },
		},
		required: ["id", "change_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should pass - foreign key references existing change record
	expect(() =>
		validateStateMutation({
			lix,
			schema: changeSetElementSchema,
			snapshot_content: {
				id: "element1",
				change_id: "change1",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should fail - foreign key references non-existent change
	expect(() =>
		validateStateMutation({
			lix,
			schema: changeSetElementSchema,
			snapshot_content: {
				id: "element2",
				change_id: "nonexistent_change",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Foreign key constraint violation");
});

test("allows updates with same primary key", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "user",
		"x-lix-primary-key": ["id"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema first
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	// Insert initial user
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "user1",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: { id: "user1", name: "John Doe" },
		})
		.execute();

	// This should pass - updating existing record with same primary key
	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: {
				id: "user1", // Same primary key
				name: "John Smith", // Different data
			},
			operation: "update",
			entity_id: "user1",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();
});

test("unique constraints are validated per version, not globally", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "file",
		"x-lix-primary-key": ["id"],
		"x-lix-unique": [["path"]], // Unique path constraint
		properties: {
			id: { type: "string" },
			path: { type: "string" },
			content: { type: "string" },
		},
		required: ["id", "path", "content"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema first
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	// Create two different versions
	await createVersion({
		lix,
		id: "version0",
	});

	await createVersion({
		lix,
		id: "version1",
	});
	// Insert file with path "/app.js" in version1
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "file1",
			file_id: "file1",
			schema_key: "file",
			plugin_key: "test_plugin",
			version_id: "version0",
			snapshot_content: {
				id: "file1",
				path: "/app.js",
				content: "console.log('version 0');",
			},
		})
		.execute();

	// This should pass - same path in different version should be allowed
	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: {
				id: "file2",
				path: "/app.js", // Same path but different version
				content: "console.log('version 1');",
			},
			operation: "insert",
			version_id: "version1",
		})
	).not.toThrowError();

	// This should fail - same path in same version
	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: {
				id: "file3",
				path: "/app.js", // Same path and same version
				content: "console.log('duplicate');",
			},
			operation: "insert",
			version_id: "version0",
		})
	).toThrowError("Unique constraint violation");
});
