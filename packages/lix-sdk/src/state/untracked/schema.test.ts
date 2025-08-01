import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { sql } from "kysely";

test("untracked schema validates JSONB content properly", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Test 1: Valid JSONB object should work
	await lixInternalDb
		.insertInto("internal_state_all_untracked")
		.values({
			entity_id: "test-valid-jsonb",
			schema_key: "lix_key_value",
			file_id: "lix",
			version_id: activeVersion.version_id,
			plugin_key: "lix_own_entity",
			snapshot_content: sql`jsonb('{"key": "test", "value": "valid"}')`,
			schema_version: "1.0",
			created_at: "2023-01-01T00:00:00.000Z",
			updated_at: "2023-01-01T00:00:00.000Z",
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
		})
		.execute();

	// Verify it was inserted correctly
	const validResult = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "test-valid-jsonb")
		.select([
			"entity_id",
			"schema_key",
			"file_id",
			"version_id",
			"plugin_key",
			sql<string | null>`json(snapshot_content)`.as("snapshot_content"),
			"schema_version",
			"created_at",
			"updated_at",
			"inherited_from_version_id",
			"inheritance_delete_marker",
		])
		.execute();

	expect(validResult).toHaveLength(1);
	// The json() function returns the parsed JSON directly
	const content = validResult[0]!.snapshot_content;
	const parsedContent =
		typeof content === "string" ? JSON.parse(content) : content;
	expect(parsedContent).toEqual({
		key: "test",
		value: "valid",
	});
});

test("untracked schema rejects invalid JSONB", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Test: Invalid JSON should be rejected by CHECK constraint
	await expect(async () => {
		await lixInternalDb
			.insertInto("internal_state_all_untracked")
			.values({
				entity_id: "test-invalid-json",
				schema_key: "lix_key_value",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_own_entity",
				snapshot_content: sql`'invalid json {'`, // Invalid JSON
				schema_version: "1.0",
				created_at: "2023-01-01T00:00:00.000Z",
				updated_at: "2023-01-01T00:00:00.000Z",
				inherited_from_version_id: null,
				inheritance_delete_marker: 0,
			})
			.execute();
	}).rejects.toThrow();
});

test("untracked schema rejects non-object JSONB types", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Test: JSONB array should be rejected (must be object)
	await expect(async () => {
		await lixInternalDb
			.insertInto("internal_state_all_untracked")
			.values({
				entity_id: "test-jsonb-array",
				schema_key: "lix_key_value",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_own_entity",
				snapshot_content: sql`jsonb('["array", "not", "object"]')`, // Array instead of object
				schema_version: "1.0",
				created_at: "2023-01-01T00:00:00.000Z",
				updated_at: "2023-01-01T00:00:00.000Z",
				inherited_from_version_id: null,
				inheritance_delete_marker: 0,
			})
			.execute();
	}).rejects.toThrow();

	// Test: JSONB string should be rejected (must be object)
	await expect(async () => {
		await lixInternalDb
			.insertInto("internal_state_all_untracked")
			.values({
				entity_id: "test-jsonb-string",
				schema_key: "lix_key_value",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_own_entity",
				snapshot_content: sql`jsonb('"just a string"')`, // String instead of object
				schema_version: "1.0",
				created_at: "2023-01-01T00:00:00.000Z",
				updated_at: "2023-01-01T00:00:00.000Z",
				inherited_from_version_id: null,
				inheritance_delete_marker: 0,
			})
			.execute();
	}).rejects.toThrow();
});

test("untracked schema validates inheritance_delete_marker constraints", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Test 1: inheritance_delete_marker = 1 with NULL content should work (tombstone)
	await lixInternalDb
		.insertInto("internal_state_all_untracked")
		.values({
			entity_id: "test-valid-tombstone",
			schema_key: "lix_key_value",
			file_id: "lix",
			version_id: activeVersion.version_id,
			plugin_key: "lix_own_entity",
			snapshot_content: null, // NULL for tombstone
			schema_version: "1.0",
			created_at: "2023-01-01T00:00:00.000Z",
			updated_at: "2023-01-01T00:00:00.000Z",
			inherited_from_version_id: null,
			inheritance_delete_marker: 1, // Tombstone marker
		})
		.execute();

	// Verify tombstone was created correctly
	const tombstoneResult = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "test-valid-tombstone")
		.selectAll()
		.execute();

	expect(tombstoneResult).toHaveLength(1);
	expect(tombstoneResult[0]!.inheritance_delete_marker).toBe(1);
	expect(tombstoneResult[0]!.snapshot_content).toBe(null);

	// Test 2: inheritance_delete_marker = 1 with content should be rejected
	await expect(async () => {
		await lixInternalDb
			.insertInto("internal_state_all_untracked")
			.values({
				entity_id: "test-invalid-tombstone",
				schema_key: "lix_key_value",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_own_entity",
				snapshot_content: sql`jsonb('{"key": "value"}')`, // Content with tombstone marker
				schema_version: "1.0",
				created_at: "2023-01-01T00:00:00.000Z",
				updated_at: "2023-01-01T00:00:00.000Z",
				inherited_from_version_id: null,
				inheritance_delete_marker: 1, // Tombstone marker but with content
			})
			.execute();
	}).rejects.toThrow();

	// Test 3: Invalid inheritance_delete_marker values should be rejected
	await expect(async () => {
		await lixInternalDb
			.insertInto("internal_state_all_untracked")
			.values({
				entity_id: "test-invalid-marker",
				schema_key: "lix_key_value",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_own_entity",
				snapshot_content: null,
				schema_version: "1.0",
				created_at: "2023-01-01T00:00:00.000Z",
				updated_at: "2023-01-01T00:00:00.000Z",
				inherited_from_version_id: null,
				inheritance_delete_marker: 2, // Invalid value (must be 0 or 1)
			})
			.execute();
	}).rejects.toThrow();
});

test("untracked schema allows NULL snapshot_content with inheritance_delete_marker = 0", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Test: inheritance_delete_marker = 0 with NULL content should work
	// (this could represent a normal deletion that's not a tombstone)
	await lixInternalDb
		.insertInto("internal_state_all_untracked")
		.values({
			entity_id: "test-null-content-normal",
			schema_key: "lix_key_value",
			file_id: "lix",
			version_id: activeVersion.version_id,
			plugin_key: "lix_own_entity",
			snapshot_content: null, // NULL content
			schema_version: "1.0",
			created_at: "2023-01-01T00:00:00.000Z",
			updated_at: "2023-01-01T00:00:00.000Z",
			inherited_from_version_id: null,
			inheritance_delete_marker: 0, // Normal marker
		})
		.execute();

	// Verify it was inserted correctly
	const result = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "test-null-content-normal")
		.selectAll()
		.execute();

	expect(result).toHaveLength(1);
	expect(result[0]!.inheritance_delete_marker).toBe(0);
	expect(result[0]!.snapshot_content).toBe(null);
});
