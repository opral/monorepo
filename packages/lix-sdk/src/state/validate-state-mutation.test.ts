import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { validateStateMutation } from "./validate-state-mutation.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

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

	expect(() =>
		// @ts-expect-error - x-key is missing
		validateStateMutation({ lix, schema, data: {} })
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

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: snapshot.content,
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

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: snapshot.content,
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

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: snapshot.content,
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

	expect(() =>
		validateStateMutation({
			lix,
			schema,
			snapshot_content: duplicateSnapshot.content,
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
		})
	).toThrowError("Primary key constraint violation");
});
