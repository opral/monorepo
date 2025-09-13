import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { updateUntrackedState } from "./update-untracked-state.js";
import { getTimestamp } from "../../engine/deterministic/timestamp.js";

test("updateUntrackedState creates direct untracked entity", async () => {
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

	const currentTime = await getTimestamp({ lix });

	// Create direct untracked entity
	updateUntrackedState({
		engine: lix.engine!,
		changes: [
			{
				id: "test-change-id",
				entity_id: "direct-untracked-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "direct-untracked-key",
					value: "direct-value",
				}),
				schema_version: "1.0",
				created_at: currentTime,
				lixcol_version_id: activeVersion.version_id,
			},
		],
	});

	// Verify entity exists in untracked table
	const result = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "direct-untracked-key")
		.where("version_id", "=", activeVersion.version_id)
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

	expect(result).toHaveLength(1);
	const content = result[0]!.snapshot_content;
	const parsedContent =
		typeof content === "string" ? JSON.parse(content) : content;
	expect(parsedContent).toEqual({
		key: "direct-untracked-key",
		value: "direct-value",
	});
	expect(result[0]!.inherited_from_version_id).toBe(null);
	expect(result[0]!.inheritance_delete_marker).toBe(0);
});

test("updateUntrackedState updates existing direct untracked entity", async () => {
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

	const currentTime = await getTimestamp({ lix });

	// Create initial entity
	updateUntrackedState({
		engine: lix.engine!,
		changes: [
			{
				id: "test-change-id",
				entity_id: "update-test-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "update-test-key",
					value: "initial-value",
				}),
				schema_version: "1.0",
				created_at: currentTime,
				lixcol_version_id: activeVersion.version_id,
			},
		],
	});

	// Update the entity
	updateUntrackedState({
		engine: lix.engine!,
		changes: [
			{
				id: "test-change-id-2",
				entity_id: "update-test-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "update-test-key",
					value: "updated-value",
				}),
				schema_version: "1.0",
				created_at: currentTime,
				lixcol_version_id: activeVersion.version_id,
			},
		],
	});

	// Verify entity was updated
	const result = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "update-test-key")
		.where("version_id", "=", activeVersion.version_id)
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

	expect(result).toHaveLength(1);
	const content = result[0]!.snapshot_content;
	const parsedContent =
		typeof content === "string" ? JSON.parse(content) : content;
	expect(parsedContent).toEqual({
		key: "update-test-key",
		value: "updated-value",
	});
});

test("updateUntrackedState deletes direct untracked entity", async () => {
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

	const currentTime = await getTimestamp({ lix });

	// Create direct untracked entity
	updateUntrackedState({
		engine: lix.engine!,
		changes: [
			{
				id: "test-change-id",
				entity_id: "delete-test-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "delete-test-key",
					value: "to-be-deleted",
				}),
				schema_version: "1.0",
				created_at: currentTime,
				lixcol_version_id: activeVersion.version_id,
			},
		],
	});

	// Verify entity exists
	const beforeDelete = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "delete-test-key")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.execute();

	expect(beforeDelete).toHaveLength(1);

	// Delete the entity
	updateUntrackedState({
		engine: lix.engine!,
		changes: [
			{
				id: "test-delete-change-id",
				entity_id: "delete-test-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: null, // Deletion
				schema_version: "1.0",
				created_at: currentTime,
				lixcol_version_id: activeVersion.version_id,
			},
		],
	});

	// Verify entity is deleted
	const afterDelete = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "delete-test-key")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(0);
});

test("updateUntrackedState creates tombstone for inherited untracked entity deletion", async () => {
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

	const currentTime = await getTimestamp({ lix });

	// Create an untracked entity in global version (parent)
	await lixInternalDb
		.insertInto("internal_state_all_untracked")
		.values({
			entity_id: "inherited-untracked-key",
			schema_key: "lix_key_value",
			file_id: "lix",
			version_id: "global",
			plugin_key: "lix_own_entity",
			snapshot_content: sql`jsonb(${JSON.stringify({
				key: "inherited-untracked-key",
				value: "parent-value",
			})})`,
			schema_version: "1.0",
			created_at: currentTime,
			updated_at: currentTime,
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
		})
		.execute();

	// Verify no direct entity exists in active version
	const beforeDelete = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "inherited-untracked-key")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.execute();

	expect(beforeDelete).toHaveLength(0);

	// Delete the inherited entity (should create tombstone)
	updateUntrackedState({
		engine: lix.engine!,
		changes: [
			{
				id: "test-inherited-delete-change-id",
				entity_id: "inherited-untracked-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: null, // Deletion
				schema_version: "1.0",
				created_at: currentTime,
				lixcol_version_id: activeVersion.version_id,
			},
		],
	});

	// Verify tombstone was created
	const afterDelete = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "inherited-untracked-key")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(1);
	expect(afterDelete[0]!.snapshot_content).toBe(null);
	expect(afterDelete[0]!.inheritance_delete_marker).toBe(1);
	expect(afterDelete[0]!.inherited_from_version_id).toBe(null);
});

test("updateUntrackedState handles timestamp consistency for new entities", async () => {
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

	const currentTime = await getTimestamp({ lix });

	// Create untracked entity
	updateUntrackedState({
		engine: lix.engine!,
		changes: [
			{
				id: "test-timestamp-change-id",
				entity_id: "timestamp-test-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "timestamp-test-key",
					value: "timestamp-value",
				}),
				schema_version: "1.0",
				created_at: currentTime,
				lixcol_version_id: activeVersion.version_id,
			},
		],
	});

	// Verify timestamps are consistent
	const result = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "timestamp-test-key")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.execute();

	expect(result).toHaveLength(1);
	expect(result[0]!.created_at).toBe(currentTime);
	expect(result[0]!.updated_at).toBe(currentTime);
});

test("updateUntrackedState resets tombstone flag when updating tombstone", async () => {
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

	const currentTime = await getTimestamp({ lix });

	// Create a tombstone first
	updateUntrackedState({
		engine: lix.engine!,
		changes: [
			{
				id: "test-tombstone-change-id",
				entity_id: "tombstone-test-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: null, // Creates tombstone
				schema_version: "1.0",
				created_at: currentTime,
				lixcol_version_id: activeVersion.version_id,
			},
		],
	});

	// Verify tombstone exists
	const tombstone = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "tombstone-test-key")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.execute();

	expect(tombstone).toHaveLength(1);
	expect(tombstone[0]!.inheritance_delete_marker).toBe(1);
	expect(tombstone[0]!.snapshot_content).toBe(null);

	// Update the tombstone with actual content
	updateUntrackedState({
		engine: lix.engine!,
		changes: [
			{
				id: "test-tombstone-update-change-id",
				entity_id: "tombstone-test-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "tombstone-test-key",
					value: "revived-value",
				}),
				schema_version: "1.0",
				created_at: currentTime,
				lixcol_version_id: activeVersion.version_id,
			},
		],
	});

	// Verify tombstone flag is reset and content is restored
	const result = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "tombstone-test-key")
		.where("version_id", "=", activeVersion.version_id)
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

	expect(result).toHaveLength(1);
	expect(result[0]!.inheritance_delete_marker).toBe(0);
	const content = result[0]!.snapshot_content;
	const parsedContent =
		typeof content === "string" ? JSON.parse(content) : content;
	expect(parsedContent).toEqual({
		key: "tombstone-test-key",
		value: "revived-value",
	});
});
