import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { validateStateMutation } from "./validate-state-mutation.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { Kysely, sql } from "kysely";
import { createVersion } from "../version/create-version.js";
import type { LixChangeSetElement } from "../change-set/schema.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

test("throws if the schema is not a valid lix schema", async () => {
	const lix = await openLix({});

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
	const lix = await openLix({});

	const result = await lix.db
		.selectFrom("stored_schema")
		.where("key", "in", ["lix_version", "lix_active_version"])
		.selectAll()
		.execute();

	expect(result.length).toBeGreaterThan(0);
});

test("valid lix schema with a valid snapshot passes", async () => {
	const lix = await openLix({});

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
	const lix = await openLix({});

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
	const lix = await openLix({});

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
	const lix = await openLix({});

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
		.insertInto("state_all")
		.values({
			entity_id: "user1",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: { id: "user1", name: "John" },
			schema_version: "1.0",
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
	const lix = await openLix({});

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
		.insertInto("state_all")
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
			schema_version: "1.0",
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
	const lix = await openLix({});

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
	const lix = await openLix({});

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
		.insertInto("state_all")
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
			schema_version: "1.0",
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
	const lix = await openLix({});

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
		.insertInto("state_all")
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
			schema_version: "1.0",
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
	const lix = await openLix({});

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
		"x-lix-foreign-keys": [
			{
				properties: ["author_id"],
				references: {
					schemaKey: "user",
					properties: ["id"],
				},
			},
		],
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
		.insertInto("state_all")
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
			schema_version: "1.0",
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
	const lix = await openLix({});

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
		"x-lix-foreign-keys": [
			{
				properties: ["author_id"],
				references: {
					schemaKey: "user",
					properties: ["id"],
				},
			},
		],
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
	const lix = await openLix({});

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
		"x-lix-foreign-keys": [
			{
				properties: ["author_id"],
				references: {
					schemaKey: "user",
					properties: ["id"],
				},
			},
			{
				properties: ["category_id"],
				references: {
					schemaKey: "category",
					properties: ["id"],
				},
			},
		],
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
		.insertInto("state_all")
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
				schema_version: "1.0",
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
				schema_version: "1.0",
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
	const lix = await openLix({});

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
		"x-lix-foreign-keys": [
			{
				properties: ["author_id"],
				references: {
					schemaKey: "user",
					properties: ["id"],
				},
			},
		],
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

test("handles composite foreign keys", async () => {
	const lix = await openLix({});

	// Create a schema that uses composite primary key
	const addressSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "address",
		"x-lix-primary-key": ["country", "postal_code", "street"],
		properties: {
			country: { type: "string" },
			postal_code: { type: "string" },
			street: { type: "string" },
			city: { type: "string" },
		},
		required: ["country", "postal_code", "street", "city"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Create a schema that references the composite key
	const deliverySchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "delivery",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": [
			{
				properties: ["address_country", "address_postal", "address_street"],
				references: {
					schemaKey: "address",
					properties: ["country", "postal_code", "street"],
				},
			},
		],
		properties: {
			id: { type: "string" },
			address_country: { type: "string" },
			address_postal: { type: "string" },
			address_street: { type: "string" },
			package_id: { type: "string" },
		},
		required: ["id", "address_country", "address_postal", "address_street", "package_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store schemas
	await lix.db
		.insertInto("stored_schema")
		.values([{ value: addressSchema }, { value: deliverySchema }])
		.execute();

	// Insert an address that will be referenced
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "addr1",
			file_id: "file1",
			schema_key: "address",
			plugin_key: "test_plugin",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: {
				country: "USA",
				postal_code: "12345",
				street: "123 Main St",
				city: "Springfield",
			},
			schema_version: "1.0",
		})
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should pass - composite foreign key reference exists
	expect(() =>
		validateStateMutation({
			lix,
			schema: deliverySchema,
			snapshot_content: {
				id: "delivery1",
				address_country: "USA",
				address_postal: "12345",
				address_street: "123 Main St",
				package_id: "pkg123",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should fail - composite foreign key reference doesn't exist (wrong postal code)
	expect(() =>
		validateStateMutation({
			lix,
			schema: deliverySchema,
			snapshot_content: {
				id: "delivery2",
				address_country: "USA",
				address_postal: "54321", // Wrong postal code
				address_street: "123 Main St",
				package_id: "pkg456",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError(/Foreign key constraint violation.*address_country, address_postal, address_street.*referencing.*address.*country, postal_code, street/);
});

test("foreign key referencing real SQL table (change.id)", async () => {
	const lix = await openLix({});

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
			schema_version: "1.0",
			file_id: "file1",
			snapshot_id: "snap1",
		})
		.execute();

	const changeSetElementSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "change_set_element_test",
		"x-lix-foreign-keys": [
			{
				properties: ["change_id"],
				references: {
					schemaKey: "lix_change",
					properties: ["id"],
				},
			},
		],
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
	const lix = await openLix({});

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
		.insertInto("state_all")
		.values({
			entity_id: "user1",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: { id: "user1", name: "John Doe" },
			schema_version: "1.0",
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
	const lix = await openLix({});

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
		.insertInto("state_all")
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
			schema_version: "1.0",
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

test("throws when version_id is not provided", async () => {
	const lix = await openLix({});

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

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: { id: "user1", name: "John" },
			operation: "insert",
			// @ts-expect-error - version_id is required but missing
			version_id: undefined,
		})
	).toThrowError("version_id is required");
});

test("throws when referenced version does not exist", async () => {
	const lix = await openLix({});

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

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: { id: "user1", name: "John" },
			operation: "insert",
			version_id: "nonexistent_version",
		})
	).toThrowError("Version with id 'nonexistent_version' does not exist");
});

test("passes when version_id is provided and version exists", async () => {
	const lix = await openLix({});

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

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: { id: "user1", name: "John" },
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();
});

test("should prevent deletion when foreign keys reference the entity", async () => {
	const lix = await openLix({});

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
		"x-lix-foreign-keys": [
			{
				properties: ["author_id"],
				references: {
					schemaKey: "user",
					properties: ["id"],
				},
			},
		],
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

	// Insert a user that will be referenced
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "user1",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: activeVersion.version_id,
			snapshot_content: {
				id: "user1",
				name: "John Doe",
			},
			schema_version: "1.0",
		})
		.execute();

	// Insert a post that references the user
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "post1",
			file_id: "file1",
			schema_key: "post",
			plugin_key: "test_plugin",
			version_id: activeVersion.version_id,
			snapshot_content: {
				id: "post1",
				author_id: "user1",
				title: "My First Post",
			},
			schema_version: "1.0",
		})
		.execute();

	// This should fail - cannot delete user because post references it
	expect(() =>
		validateStateMutation({
			lix,
			schema: userSchema,
			snapshot_content: {}, // Not used for delete operations
			operation: "delete",
			entity_id: "user1",
			version_id: activeVersion.version_id,
		})
	).toThrowError(
		/Foreign key constraint violation.*referenced by.*post.*author_id/i
	);
});

test("should allow deletion when no foreign keys reference the entity", async () => {
	const lix = await openLix({});

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

	// Store schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: userSchema })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Insert a user with no references
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "user1",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: activeVersion.version_id,
			snapshot_content: {
				id: "user1",
				name: "John Doe",
			},
			schema_version: "1.0",
		})
		.execute();

	// This should pass - no foreign keys reference this user
	expect(() =>
		validateStateMutation({
			lix,
			schema: userSchema,
			snapshot_content: {}, // Not used for delete operations
			operation: "delete",
			entity_id: "user1",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();
});

test("should throw when deleting non-existent entity", async () => {
	const lix = await openLix({});

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

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should fail - entity does not exist
	expect(() =>
		validateStateMutation({
			lix,
			schema: userSchema,
			snapshot_content: {},
			operation: "delete",
			entity_id: "nonexistent_user",
			version_id: activeVersion.version_id,
		})
	).toThrowError(/Entity deletion failed/);
});

test("should throw when entity_id is missing for delete operations", async () => {
	const lix = await openLix({});

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

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// This should fail - entity_id is required for delete
	expect(() =>
		validateStateMutation({
			lix,
			schema: userSchema,
			snapshot_content: {},
			operation: "delete",
			// entity_id is missing
			version_id: activeVersion.version_id,
		})
	).toThrowError("entity_id is required for delete operations");
});

test("should handle deletion validation for change sets referenced by versions", async () => {
	const lix = await openLix({});

	// Create a change set
	await lix.db
		.insertInto("change_set_all")
		.values({ id: "cs_referenced", lixcol_version_id: "global" })
		.execute();

	// Create a version that references the change set
	await lix.db
		.insertInto("version")
		.values({
			id: "v1",
			name: "test_version",
			change_set_id: "cs_referenced",
			working_change_set_id: "cs_referenced",
		})
		.execute();

	// const activeVersion = await lix.db
	// 	.selectFrom("active_version")
	// 	.select("version_id")
	// 	.executeTakeFirstOrThrow();

	// Get the change set schema
	const changeSetSchema = await lix.db
		.selectFrom("stored_schema")
		.select("value")
		.where("key", "=", "lix_change_set")
		.executeTakeFirstOrThrow();

	// This should fail - cannot delete change set because version references it
	expect(() =>
		validateStateMutation({
			lix,
			schema: changeSetSchema.value as LixSchemaDefinition,
			snapshot_content: {},
			operation: "delete",
			entity_id: "cs_referenced",
			version_id: "global",
		})
	).toThrowError(
		/Foreign key constraint violation.*Cannot delete entity.*referenced by.*lix_version/i
	);
});

test("should parse JSON object properties before validation", async () => {
	const lix = await openLix({});

	// Define a schema with an object property
	const documentSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "document",
		"x-lix-primary-key": ["id"],
		properties: {
			id: { type: "string" },
			title: { type: "string" },
			body: {
				type: "object",
				properties: {
					type: { type: "string" },
					content: { type: "array" },
				},
				required: ["type", "content"],
			},
		},
		required: ["id", "title", "body"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: documentSchema })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Test with valid JSON object - this should pass
	const validSnapshotContent = {
		id: "doc1",
		title: "Test Document",
		body: JSON.stringify({
			type: "zettel_doc",
			content: [
				{
					type: "zettel_text_block",
					zettel_key: "test_key",
					style: "zettel_normal",
					children: [],
				},
			],
		}),
	};

	expect(() =>
		validateStateMutation({
			lix,
			schema: documentSchema,
			snapshot_content: validSnapshotContent,
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// Test with invalid JSON object - this should fail
	const invalidSnapshotContent = {
		id: "doc2",
		title: "Invalid Document",
		body: JSON.stringify({
			type: "invalid_type", // Missing required 'content' property
		}),
	};

	expect(() =>
		validateStateMutation({
			lix,
			schema: documentSchema,
			snapshot_content: invalidSnapshotContent,
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError(/body.*must have required property.*content/);

	// Test with malformed JSON string - this should fail
	const malformedSnapshotContent = {
		id: "doc3",
		title: "Malformed Document",
		body: "{ invalid json",
	};

	expect(() =>
		validateStateMutation({
			lix,
			schema: documentSchema,
			snapshot_content: malformedSnapshotContent,
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError(/Invalid JSON in property 'body'/);
});

test("foreign key validation should fail when referenced entity exists in different non-inheriting version", async () => {
	const lix = await openLix({});

	// Mock schema for a "User" entity
	const userSchema = {
		"x-lix-key": "mock_user",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Mock schema for a "Post" entity that references User
	const postSchema = {
		"x-lix-key": "mock_post",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": [
			{
				properties: ["author_id"],
				references: {
					schemaKey: "mock_user",
					properties: ["id"],
				},
			},
		],
		type: "object",
		properties: {
			id: { type: "string" },
			title: { type: "string" },
			author_id: { type: "string" },
		},
		required: ["id", "title", "author_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Register our mock schemas
	await lix.db
		.insertInto("stored_schema")
		.values([{ value: userSchema }, { value: postSchema }])
		.execute();

	// Create two separate versions that don't inherit from each other
	const versionA = await createVersion({
		lix,
		name: "version-a",
	});

	const versionB = await createVersion({
		lix,
		name: "version-b",
	});

	// Verify they don't inherit from each other
	// Both should inherit from global, but not from each other
	expect(versionA.inherits_from_version_id).toBe("global");
	expect(versionB.inherits_from_version_id).toBe("global");

	// Create a user in version A
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "user-1",
			schema_key: "mock_user",
			file_id: "test",
			plugin_key: "test_plugin",
			snapshot_content: {
				id: "user-1",
				name: "Alice",
			},
			schema_version: "1.0",
			version_id: versionA.id,
		})
		.execute();

	// BUG: This should FAIL because user-1 doesn't exist in version B's context
	// but the current foreign key validation logic will find user-1 in version A
	// and incorrectly allow this validation to succeed
	expect(() =>
		validateStateMutation({
			lix,
			schema: postSchema,
			snapshot_content: {
				id: "post-1",
				title: "My Post",
				author_id: "user-1", // References user-1 which only exists in version A
			},
			operation: "insert",
			version_id: versionB.id,
		})
	).toThrow(/Foreign key constraint violation.*mock_user.*user-1/);

	// Verify that user-1 indeed doesn't exist in version B's context
	const userInVersionB = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "user-1")
		.where("schema_key", "=", "mock_user")
		.where("version_id", "=", versionB.id)
		.selectAll()
		.execute();

	expect(userInVersionB).toHaveLength(0);

	// But verify it does exist in version A
	const userInVersionA = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "user-1")
		.where("schema_key", "=", "mock_user")
		.where("version_id", "=", versionA.id)
		.selectAll()
		.execute();

	expect(userInVersionA).toHaveLength(1);
});

test("should allow self-referential foreign keys", async () => {
	const lix = await openLix({});

	// Define a schema with self-referential foreign key (like version inheritance)
	const versionSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock_version",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": [
			{
				properties: ["inherits_from_version_id"],
				references: {
					schemaKey: "mock_version", // Self-referential foreign key
					properties: ["id"],
				},
			},
		],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			inherits_from_version_id: { type: ["string", "null"] },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: versionSchema })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Insert a parent version first (with null inheritance)
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "version0",
			file_id: "file1",
			schema_key: "mock_version",
			plugin_key: "test_plugin",
			version_id: activeVersion.version_id,
			snapshot_content: {
				id: "version0",
				name: "version0",
				inherits_from_version_id: null,
			},
			schema_version: "1.0",
		})
		.execute();

	// This should pass - child version referencing parent version (valid self-referential FK)
	expect(() =>
		validateStateMutation({
			lix,
			schema: versionSchema,
			snapshot_content: {
				id: "version1",
				name: "version1",
				inherits_from_version_id: "version0", // References another entity in same schema
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should also pass - version with null inheritance (no foreign key constraint)
	expect(() =>
		validateStateMutation({
			lix,
			schema: versionSchema,
			snapshot_content: {
				id: "version2",
				name: "version2",
				inherits_from_version_id: null, // No foreign key reference
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should fail - referencing non-existent version
	expect(() =>
		validateStateMutation({
			lix,
			schema: versionSchema,
			snapshot_content: {
				id: "version3",
				name: "version3",
				inherits_from_version_id: "nonexistent_version",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Foreign key constraint violation");
});

test("should allow self-referential foreign keys for update operations", async () => {
	const lix = await openLix({});

	// Define a schema with self-referential foreign key
	const versionSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock_version",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": [
			{
				properties: ["inherits_from_version_id"],
				references: {
					schemaKey: "mock_version",
					properties: ["id"],
				},
			},
		],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			inherits_from_version_id: { type: ["string", "null"] },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: versionSchema })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Insert initial versions
	await lix.db
		.insertInto("state_all")
		.values([
			{
				entity_id: "version0",
				file_id: "file1",
				schema_key: "mock_version",
				plugin_key: "test_plugin",
				version_id: activeVersion.version_id,
				snapshot_content: {
					id: "version0",
					name: "version0",
					inherits_from_version_id: null,
				},
				schema_version: "1.0",
			},
			{
				entity_id: "version1",
				file_id: "file1",
				schema_key: "mock_version",
				plugin_key: "test_plugin",
				version_id: activeVersion.version_id,
				snapshot_content: {
					id: "version1",
					name: "version1",
					inherits_from_version_id: "version0",
				},
				schema_version: "1.0",
			},
		])
		.execute();

	// This should pass - updating to reference a different valid version
	expect(() =>
		validateStateMutation({
			lix,
			schema: versionSchema,
			snapshot_content: {
				id: "version1",
				name: "version1_updated",
				inherits_from_version_id: null, // Change from version0 to null
			},
			operation: "update",
			entity_id: "version1",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should fail - updating to reference non-existent version
	expect(() =>
		validateStateMutation({
			lix,
			schema: versionSchema,
			snapshot_content: {
				id: "version1",
				name: "version1_updated",
				inherits_from_version_id: "nonexistent_version",
			},
			operation: "update",
			entity_id: "version1",
			version_id: activeVersion.version_id,
		})
	).toThrowError("Foreign key constraint violation");
});

test("should prevent deletion when self-referential foreign keys reference the entity", async () => {
	const lix = await openLix({});

	// Define a schema with self-referential foreign key
	const versionSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock_version",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": [
			{
				properties: ["inherits_from_version_id"],
				references: {
					schemaKey: "mock_version",
					properties: ["id"],
				},
			},
		],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			inherits_from_version_id: { type: ["string", "null"] },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: versionSchema })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Insert parent and child versions
	await lix.db
		.insertInto("state_all")
		.values([
			{
				entity_id: "version0",
				file_id: "file1",
				schema_key: "mock_version",
				plugin_key: "test_plugin",
				version_id: activeVersion.version_id,
				snapshot_content: {
					id: "version0",
					name: "version0",
					inherits_from_version_id: null,
				},
				schema_version: "1.0",
			},
			{
				entity_id: "version1",
				file_id: "file1",
				schema_key: "mock_version",
				plugin_key: "test_plugin",
				version_id: activeVersion.version_id,
				snapshot_content: {
					id: "version1",
					name: "version1",
					inherits_from_version_id: "version0", // References version0
				},
				schema_version: "1.0",
			},
		])
		.execute();

	// This should fail - cannot delete version0 because version1 references it
	expect(() =>
		validateStateMutation({
			lix,
			schema: versionSchema,
			snapshot_content: {},
			operation: "delete",
			entity_id: "version0",
			version_id: activeVersion.version_id,
		})
	).toThrowError(
		/Foreign key constraint violation.*referenced by.*mock_version.*inherits_from_version_id/
	);

	// This should pass - can delete version1 (no other versions reference it)
	expect(() =>
		validateStateMutation({
			lix,
			schema: versionSchema,
			snapshot_content: {},
			operation: "delete",
			entity_id: "version1",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();
});

// Foreign keys are restricted to the current version context to maintain data integrity
// and prevent confusing dependency relationships across version boundaries. While entities
// can be inherited from parent versions through the copy-on-write system, foreign key
// constraints require explicit, direct relationships within the same version scope.
// This design choice ensures that:
// 1. FK constraints are predictable and version-scoped
// 2. No hidden dependencies exist across version boundaries
// 3. Copy-on-write semantics remain clear and isolated
// 4. Data integrity is maintained within each version context
test("should prevent foreign key references to inherited entities from different version contexts", async () => {
	const lix = await openLix({});

	// Create a thread in global context
	await lix.db
		.insertInto("thread_all")
		.values({
			id: "global_thread",
			metadata: { title: "Global Thread" },
			lixcol_version_id: "global",
		})
		.execute();

	// Get the active version (should be "main" version)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Get the thread comment schema
	const threadCommentSchema = await lix.db
		.selectFrom("stored_schema")
		.select("value")
		.where("key", "=", "lix_thread_comment")
		.executeTakeFirstOrThrow();

	// This should FAIL: attempting to create a thread_comment in the active version
	// that references a thread that only exists in global context.
	// Foreign keys should only work within the same version context.
	expect(() =>
		validateStateMutation({
			lix,
			schema: threadCommentSchema.value as LixSchemaDefinition,
			snapshot_content: {
				id: "comment1",
				thread_id: "global_thread", // References thread in global context
				parent_id: null,
				body: {
					type: "zettel_doc",
					content: [
						{
							type: "zettel_text_block",
							zettel_key: "test_key",
							style: "zettel_normal",
							children: [],
						},
					],
				},
			},
			operation: "insert",
			version_id: activeVersion.version_id, // But creating comment in active version context
		})
	).toThrow(/Foreign key constraint violation.*lix_thread.*global_thread/);
});

test("should prevent change set elements from referencing change sets defined in global context", async () => {
	const lix = await openLix({});

	// Create a change set in global context
	await lix.db
		.insertInto("change_set_all")
		.values({
			id: "global_change_set",
			lixcol_version_id: "global",
		})
		.execute();

	// Get the active version (should be "main" version)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Get the change set element schema
	const changeSetElementSchema = await lix.db
		.selectFrom("stored_schema")
		.select("value")
		.where("key", "=", "lix_change_set_element")
		.executeTakeFirstOrThrow();

	// This should FAIL: attempting to create a change_set_element in the active version
	// that references a change set that exists in global context.
	// The bug is that this currently passes when it should fail.
	expect(() =>
		validateStateMutation({
			lix,
			schema: changeSetElementSchema.value as LixSchemaDefinition,
			snapshot_content: {
				change_set_id: "global_change_set", // References change set in global context
				change_id: "dummy_change_id",
				entity_id: "dummy_entity_id",
				file_id: "dummy_file_id",
				schema_key: "dummy_schema_key",
			} satisfies LixChangeSetElement,
			operation: "insert",
			version_id: activeVersion.version_id, // But creating element in active version context
		})
	).toThrow(
		/Foreign key constraint violation.*lix_change_set.*global_change_set/
	);
});

// Untracked state foreign key tests
// SCENARIO: Tracked → Untracked Foreign Key Reference
// WHY THIS TEST EXISTS: Untracked entities are local-only and won't be synced to remote.
// If a tracked entity references an untracked entity, it would create broken references
// when synced because the untracked entity doesn't exist on the remote.
// BEHAVIOR: DISALLOWED - This would break data integrity during sync operations.
test("should prevent tracked entities from referencing untracked entities", async () => {
	const lix = await openLix({});

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
		"x-lix-foreign-keys": [
			{
				properties: ["author_id"],
				references: {
					schemaKey: "user",
					properties: ["id"],
				},
			},
		],
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

	// Insert an untracked user
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "untracked_user",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: activeVersion.version_id,
			snapshot_content: {
				id: "untracked_user",
				name: "Untracked User",
			},
			schema_version: "1.0",
			untracked: true,
		})
		.execute();

	// This should FAIL - tracked entity cannot reference untracked entity
	expect(() =>
		validateStateMutation({
			lix,
			schema: postSchema,
			snapshot_content: {
				id: "post1",
				author_id: "untracked_user", // References untracked user
				title: "My Post",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrow(
		/Foreign key constraint violation.*tracked entities cannot reference untracked entities.*This would create broken references during sync/
	);
});

// SCENARIO: Untracked → Tracked Foreign Key Reference
// WHY THIS TEST EXISTS: Untracked entities are local-only and won't be synced.
// Since they remain local, they can safely reference tracked entities without
// breaking data integrity. The untracked entity simply won't exist on remote.
// BEHAVIOR: ALLOWED - Safe because untracked entities don't participate in sync.
test("should allow untracked entities to reference tracked entities", async () => {
	const lix = await openLix({});

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
		"x-lix-foreign-keys": [
			{
				properties: ["author_id"],
				references: {
					schemaKey: "user",
					properties: ["id"],
				},
			},
		],
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

	// Insert a tracked user
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "tracked_user",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: activeVersion.version_id,
			snapshot_content: {
				id: "tracked_user",
				name: "Tracked User",
			},
			schema_version: "1.0",
			untracked: false,
		})
		.execute();

	// Create validation arguments for untracked post
	const validationArgs = {
		lix,
		schema: postSchema,
		snapshot_content: {
			id: "untracked_post",
			author_id: "tracked_user", // References tracked user
			title: "My Untracked Post",
		},
		operation: "insert" as const,
		version_id: activeVersion.version_id,
		untracked: true, // Mark as untracked
	};

	// This should PASS - untracked entity can reference tracked entity
	expect(() => validateStateMutation(validationArgs)).not.toThrow();
});

// SCENARIO: Untracked → Untracked Foreign Key Reference
// WHY THIS TEST EXISTS: Both entities are local-only and won't be synced.
// They exist in the same local scope, so references between them are valid
// and won't cause any sync issues since neither entity leaves the local system.
// BEHAVIOR: ALLOWED - Both entities remain local, maintaining referential integrity.
test("should allow untracked entities to reference other untracked entities", async () => {
	const lix = await openLix({});

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
		"x-lix-foreign-keys": [
			{
				properties: ["author_id"],
				references: {
					schemaKey: "user",
					properties: ["id"],
				},
			},
		],
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

	// Insert an untracked user
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "untracked_user",
			file_id: "file1",
			schema_key: "user",
			plugin_key: "test_plugin",
			version_id: activeVersion.version_id,
			snapshot_content: {
				id: "untracked_user",
				name: "Untracked User",
			},
			schema_version: "1.0",
			untracked: true,
		})
		.execute();

	// Create validation arguments for untracked post
	const validationArgs = {
		lix,
		schema: postSchema,
		snapshot_content: {
			id: "untracked_post",
			author_id: "untracked_user", // References untracked user
			title: "My Untracked Post",
		},
		operation: "insert" as const,
		version_id: activeVersion.version_id,
		untracked: true, // Mark as untracked
	};

	// This should PASS - untracked entity can reference another untracked entity
	expect(() => validateStateMutation(validationArgs)).not.toThrow();
});

test("should detect and prevent cycles in change set graph when lix_debug is enabled", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_debug", value: "true" }],
	});

	// Get the change set edge schema
	const changeSetEdgeSchema = await lix.db
		.selectFrom("stored_schema")
		.select("value")
		.where("key", "=", "lix_change_set_edge")
		.executeTakeFirstOrThrow();

	// Create a few change sets
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs1", lixcol_version_id: "global" },
			{ id: "cs2", lixcol_version_id: "global" },
			{ id: "cs3", lixcol_version_id: "global" },
		])
		.execute();

	// Create edges: cs1 -> cs2 -> cs3
	await lix.db
		.insertInto("change_set_edge_all")
		.values([
			{ parent_id: "cs1", child_id: "cs2", lixcol_version_id: "global" },
			{ parent_id: "cs2", child_id: "cs3", lixcol_version_id: "global" },
		])
		.execute();

	// This should fail - creating cs3 -> cs1 would create a cycle
	expect(() =>
		validateStateMutation({
			lix,
			schema: changeSetEdgeSchema.value as LixSchemaDefinition,
			snapshot_content: {
				parent_id: "cs3",
				child_id: "cs1", // This would complete the cycle
			},
			operation: "insert",
			version_id: "global",
		})
	).toThrowError(
		/Cycle detected in change set graph.*New edge: cs3 -> cs1.*Cycle path: cs1 -> cs2 -> cs3 -> cs1/s
	);

	// This should also fail - self-loop
	expect(() =>
		validateStateMutation({
			lix,
			schema: changeSetEdgeSchema.value as LixSchemaDefinition,
			snapshot_content: {
				parent_id: "cs1",
				child_id: "cs1", // Self-referencing edge
			},
			operation: "insert",
			version_id: "global",
		})
	).toThrowError(/Self-referencing edges are not allowed/);
});

test("should not check for cycles when lix_debug is disabled", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_debug", value: "false" }],
	});

	// Get the change set edge schema
	const changeSetEdgeSchema = await lix.db
		.selectFrom("stored_schema")
		.select("value")
		.where("key", "=", "lix_change_set_edge")
		.executeTakeFirstOrThrow();

	// Create a few change sets
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs1", lixcol_version_id: "global" },
			{ id: "cs2", lixcol_version_id: "global" },
			{ id: "cs3", lixcol_version_id: "global" },
		])
		.execute();

	// Create edges: cs1 -> cs2 -> cs3
	await lix.db
		.insertInto("change_set_edge_all")
		.values([
			{ parent_id: "cs1", child_id: "cs2", lixcol_version_id: "global" },
			{ parent_id: "cs2", child_id: "cs3", lixcol_version_id: "global" },
		])
		.execute();

	// This would create a cycle, but with lix_debug=false it won't be detected
	// (This is intentional for performance - cycle detection is expensive)
	expect(() =>
		validateStateMutation({
			lix,
			schema: changeSetEdgeSchema.value as LixSchemaDefinition,
			snapshot_content: {
				parent_id: "cs3",
				child_id: "cs1", // This would complete the cycle
			},
			operation: "insert",
			version_id: "global",
		})
	).not.toThrowError();
});

test("should validate foreign keys that reference changes in internal_change_in_transaction during transaction", async () => {
	const lix = await openLix({});

	// Create a simple mock schema that references a change
	const mockChangeReferencingSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock_change_reference",
		"x-lix-primary-key": ["change_id"],
		"x-lix-foreign-keys": [
			{
				properties: ["change_id"],
				references: {
					schemaKey: "lix_change",
					properties: ["id"],
				},
			},
		],
		properties: {
			change_id: { type: "string" },
		},
		required: ["change_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the mock schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockChangeReferencingSchema })
		.execute();

	// Get active version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	await lix.db.transaction().execute(async (trx) => {
		// Insert a key-value entity which creates a change in internal_change_in_transaction
		await trx
			.insertInto("key_value")
			.values({
				key: "test_key_for_change_reference",
				value: "test_value",
			})
			.execute();

		// Get the change ID that was just created in internal_change_in_transaction
		const changes = await (trx as unknown as Kysely<LixInternalDatabaseSchema>)
			.selectFrom("internal_change_in_transaction")
			.select("id")
			.where("entity_id", "=", "test_key_for_change_reference")
			.where("schema_key", "=", "lix_key_value")
			.execute();

		expect(changes).toHaveLength(1);
		const changeId = changes[0]!.id;

		// This should NOT throw an error because the change exists in internal_change_in_transaction
		// But currently it will throw because validation only checks the "change" table (internal_change)
		// which doesn't include internal_change_in_transaction
		expect(() =>
			validateStateMutation({
				lix: { sqlite: lix.sqlite, db: trx as any },
				schema: mockChangeReferencingSchema,
				snapshot_content: {
					change_id: changeId,
				},
				operation: "insert",
				version_id: activeVersion.version_id,
			})
		).not.toThrowError();
	});
});

/**
 * 🧪 Regression-guard for “versionless change FKs”
 *
 * Context from architecture discussion:
 * ─────────────────────────────────────
 * • `lix_change` rows are **version-agnostic** (no `version_id` column) and
 *   append-only.  They form the immutable source-of-truth that every branch
 *   materialises state from.
 *
 * • Therefore **any** version-scoped table is allowed to carry a foreign key
 *   that points at `lix_change.id`, because the target row can never disappear
 *   or mutate in a way that would break the reference.
 *
 * • The validator treats these targets specially: if the referenced schema’s
 *   scope is `versionless`, it skips the usual “same version” check.
 *
 * What this test proves:
 * ──────────────────────
 * 1. A table that references `lix_change.id` can be inserted **in the global
 *    context**.
 * 2. The **same row** can also be inserted in an arbitrary branch
 *    (`activeVersion.version_id`) without triggering a
 *    “foreign-key constraint violation”.
 *
 * If either expectation starts failing, it means the validator has regressed
 * and is once again enforcing version isolation for versionless targets—
 * something we explicitly decided against.
 */
test("should allow foreign keys to changes from any version context", async () => {
	const lix = await openLix({});

	// Create a schema that references change.id (like change_author does)
	const mockSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock_schema",
		"x-lix-primary-key": ["change_id"],
		"x-lix-foreign-keys": [
			{
				properties: ["change_id"],
				references: {
					schemaKey: "lix_change",
					properties: ["id"],
				},
			},
		],
		properties: {
			change_id: { type: "string" },
		},
		required: ["change_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// First create a key-value entity to generate a real change
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key_for_change_ref",
			value: "test_value",
		})
		.execute();

	// Get the change that was created
	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "test_key_for_change_ref")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);
	const realChangeId = changes[0]!.id;

	// This should PASS because changes are versionless and can be referenced from global version
	expect(() =>
		validateStateMutation({
			lix,
			schema: mockSchema,
			snapshot_content: {
				change_id: realChangeId,
			},
			operation: "insert",
			version_id: "global",
		})
	).not.toThrowError();

	// This should ALSO PASS because changes are versionless and can be referenced from any version
	expect(() =>
		validateStateMutation({
			lix,
			schema: mockSchema,
			snapshot_content: {
				change_id: realChangeId,
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();
});

// State table foreign key tests
test("should validate composite foreign keys referencing state table", async () => {
	const lix = await openLix({});

	// Create a schema that references state table with composite key (like entity_label does)
	const mockStateReferenceSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock_state_reference",
		"x-lix-primary-key": ["entity_id", "schema_key", "file_id", "tag"],
		"x-lix-foreign-keys": [
			{
				properties: ["entity_id", "schema_key", "file_id"],
				references: {
					schemaKey: "state",
					properties: ["entity_id", "schema_key", "file_id"],
				},
			},
		],
		properties: {
			entity_id: { type: "string" },
			schema_key: { type: "string" },
			file_id: { type: "string" },
			tag: { type: "string" },
		},
		required: ["entity_id", "schema_key", "file_id", "tag"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockStateReferenceSchema })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// First create a state entity that can be referenced
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "test_entity",
			schema_key: "test_schema",
			file_id: "test_file.json",
			plugin_key: "test_plugin",
			version_id: activeVersion.version_id,
			snapshot_content: { id: "test_entity" },
			schema_version: "1.0",
		})
		.execute();

	// This should PASS - entity exists in state table
	expect(() =>
		validateStateMutation({
			lix,
			schema: mockStateReferenceSchema,
			snapshot_content: {
				entity_id: "test_entity",
				schema_key: "test_schema",
				file_id: "test_file.json",
				tag: "important",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should FAIL - entity doesn't exist in state table
	expect(() =>
		validateStateMutation({
			lix,
			schema: mockStateReferenceSchema,
			snapshot_content: {
				entity_id: "nonexistent_entity",
				schema_key: "test_schema",
				file_id: "test_file.json",
				tag: "important",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrow(
		/Foreign key constraint violation.*mock_state_reference.*\(entity_id, schema_key, file_id\).*state\.\(entity_id, schema_key, file_id\).*no matching record exists/
	);
});

test("state foreign key references should respect version context", async () => {
	const lix = await openLix({});

	// Create a schema that references state table
	const mockStateReferenceSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock_state_reference",
		"x-lix-primary-key": ["entity_id", "schema_key", "file_id", "tag"],
		"x-lix-foreign-keys": [
			{
				properties: ["entity_id", "schema_key", "file_id"],
				references: {
					schemaKey: "state",
					properties: ["entity_id", "schema_key", "file_id"],
				},
			},
		],
		properties: {
			entity_id: { type: "string" },
			schema_key: { type: "string" },
			file_id: { type: "string" },
			tag: { type: "string" },
		},
		required: ["entity_id", "schema_key", "file_id", "tag"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockStateReferenceSchema })
		.execute();

	// Create a second version
	const version2 = await createVersion({
		lix,
		name: "version2",
	});

	// Get the main version
	const mainVersion = await lix.db
		.selectFrom("version")
		.select("id")
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	// Create state entity in main version only
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "main_only_entity",
			schema_key: "test_schema",
			file_id: "test.json",
			plugin_key: "test_plugin",
			version_id: mainVersion.id,
			snapshot_content: { id: "main_only_entity" },
			schema_version: "1.0",
		})
		.execute();

	// Create state entity in version2 only
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "version2_only_entity",
			schema_key: "test_schema",
			file_id: "test.json",
			plugin_key: "test_plugin",
			version_id: version2.id,
			snapshot_content: { id: "version2_only_entity" },
			schema_version: "1.0",
		})
		.execute();

	// Reference from main version should only see main entities
	expect(() =>
		validateStateMutation({
			lix,
			schema: mockStateReferenceSchema,
			snapshot_content: {
				entity_id: "main_only_entity",
				schema_key: "test_schema",
				file_id: "test.json",
				tag: "tag1",
			},
			operation: "insert",
			version_id: mainVersion.id,
		})
	).not.toThrowError();

	// Reference from main version to version2 entity should fail
	expect(() =>
		validateStateMutation({
			lix,
			schema: mockStateReferenceSchema,
			snapshot_content: {
				entity_id: "version2_only_entity",
				schema_key: "test_schema",
				file_id: "test.json",
				tag: "tag2",
			},
			operation: "insert",
			version_id: mainVersion.id,
		})
	).toThrow(/Foreign key constraint violation/);

	// Reference from version2 should only see version2 entities
	expect(() =>
		validateStateMutation({
			lix,
			schema: mockStateReferenceSchema,
			snapshot_content: {
				entity_id: "version2_only_entity",
				schema_key: "test_schema",
				file_id: "test.json",
				tag: "tag3",
			},
			operation: "insert",
			version_id: version2.id,
		})
	).not.toThrowError();

	// Reference from version2 to main entity should fail
	expect(() =>
		validateStateMutation({
			lix,
			schema: mockStateReferenceSchema,
			snapshot_content: {
				entity_id: "main_only_entity",
				schema_key: "test_schema",
				file_id: "test.json",
				tag: "tag4",
			},
			operation: "insert",
			version_id: version2.id,
		})
	).toThrow(/Foreign key constraint violation/);
});

test("state foreign key references should handle inherited entities", async () => {
	const lix = await openLix({});

	// Create a schema that references state table
	const mockStateReferenceSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock_state_reference",
		"x-lix-primary-key": ["entity_id", "schema_key", "file_id", "tag"],
		"x-lix-foreign-keys": [
			{
				properties: ["entity_id", "schema_key", "file_id"],
				references: {
					schemaKey: "state",
					properties: ["entity_id", "schema_key", "file_id"],
				},
			},
		],
		properties: {
			entity_id: { type: "string" },
			schema_key: { type: "string" },
			file_id: { type: "string" },
			tag: { type: "string" },
		},
		required: ["entity_id", "schema_key", "file_id", "tag"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockStateReferenceSchema })
		.execute();

	// Get the main version
	const mainVersion = await lix.db
		.selectFrom("version")
		.select("id")
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	// Create a state entity in main version
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "shared_entity",
			schema_key: "test_schema",
			file_id: "test.json",
			plugin_key: "test_plugin",
			version_id: mainVersion.id,
			snapshot_content: { id: "shared_entity", value: "original" },
			schema_version: "1.0",
		})
		.execute();

	// Create a child version that inherits from main
	const childVersion = await createVersion({
		lix,
		name: "child_version",
		inherits_from_version_id: mainVersion.id,
	});

	// The inherited entity should NOT be visible for foreign key validation
	// because foreign keys only validate entities in the same version (not inherited)
	expect(() =>
		validateStateMutation({
			lix,
			schema: mockStateReferenceSchema,
			snapshot_content: {
				entity_id: "shared_entity",
				schema_key: "test_schema",
				file_id: "test.json",
				tag: "from_child",
			},
			operation: "insert",
			version_id: childVersion.id,
		})
	).toThrow(
		/Foreign key constraint violation.*no matching record exists.*Note: Foreign key constraints only validate entities that exist in the version context/s
	);
});

test("state foreign key with mixed single and composite properties", async () => {
	const lix = await openLix({});

	// Create a complex schema with multiple foreign keys
	const complexSchema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "complex_reference",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": [
			{
				// Composite foreign key to state
				properties: ["entity_id", "schema_key", "file_id"],
				references: {
					schemaKey: "state",
					properties: ["entity_id", "schema_key", "file_id"],
				},
			},
			{
				// Single property foreign key to change
				properties: ["change_id"],
				references: {
					schemaKey: "lix_change",
					properties: ["id"],
				},
			},
		],
		properties: {
			id: { type: "string" },
			entity_id: { type: "string" },
			schema_key: { type: "string" },
			file_id: { type: "string" },
			change_id: { type: "string" },
		},
		required: ["id", "entity_id", "schema_key", "file_id", "change_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Store the schema
	await lix.db
		.insertInto("stored_schema")
		.values({ value: complexSchema })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Create a state entity
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "test_entity",
			schema_key: "test_schema",
			file_id: "test.json",
			plugin_key: "test_plugin",
			version_id: activeVersion.version_id,
			snapshot_content: { id: "test_entity" },
			schema_version: "1.0",
		})
		.execute();

	// Create a key-value to generate a change
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	// Get the created change
	const changes = await lix.db
		.selectFrom("change")
		.select("id")
		.where("entity_id", "=", "test_key")
		.execute();

	expect(changes).toHaveLength(1);
	const changeId = changes[0]!.id;

	// This should PASS - both foreign keys are satisfied
	expect(() =>
		validateStateMutation({
			lix,
			schema: complexSchema,
			snapshot_content: {
				id: "complex1",
				entity_id: "test_entity",
				schema_key: "test_schema",
				file_id: "test.json",
				change_id: changeId,
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).not.toThrowError();

	// This should FAIL - state foreign key not satisfied
	expect(() =>
		validateStateMutation({
			lix,
			schema: complexSchema,
			snapshot_content: {
				id: "complex2",
				entity_id: "nonexistent",
				schema_key: "test_schema",
				file_id: "test.json",
				change_id: changeId,
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrow(/Foreign key constraint violation.*state/);

	// This should FAIL - change foreign key not satisfied
	expect(() =>
		validateStateMutation({
			lix,
			schema: complexSchema,
			snapshot_content: {
				id: "complex3",
				entity_id: "test_entity",
				schema_key: "test_schema",
				file_id: "test.json",
				change_id: "nonexistent_change",
			},
			operation: "insert",
			version_id: activeVersion.version_id,
		})
	).toThrow(/Foreign key constraint violation.*lix_change/);
});
