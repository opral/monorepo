import { expect, test } from "vitest";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { Kysely, sql } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { createVersion } from "../../version/create-version.js";
import {
	simulationTest,
	normalSimulation,
} from "../../test-utilities/simulation-test/simulation-test.js";
import { createVersionFromCommit } from "../../version/create-version-from-commit.js";
import { openLix } from "../../lix/open-lix.js";
import { withWriterKey } from "../writer.js";
import { schemaKeyToCacheTableName } from "../cache/create-schema-cache-table.js";

test("simulation test discover", () => {});

simulationTest(
	"select, insert, update, delete entity via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "string",
				},
			},
		};

		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const internalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Test INSERT via lix_internal_state_vtable
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({
					value: "hello world",
				}),
				untracked: 0,
			})
			.execute();

		// Test SELECT from lix_internal_state_vtable
		const viewAfterInsert = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.orderBy("entity_id")
			.select([
				"entity_id",
				"file_id",
				"schema_key",
				"plugin_key",
				sql`json(snapshot_content)`.as("snapshot_content"),
			])
			.execute();

		expect(viewAfterInsert).toMatchObject([
			{
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				snapshot_content: {
					value: "hello world",
				},
			},
		]);

		// Test UPDATE via lix_internal_state_vtable
		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({
					value: "hello world - updated",
				}),
			})
			.where("entity_id", "=", "e0")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "f0")
			.execute();

		const viewAfterUpdate = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.orderBy("entity_id")
			.select([
				"entity_id",
				"file_id",
				"schema_key",
				"plugin_key",
				sql`json(snapshot_content)`.as("snapshot_content"),
			])
			.execute();

		expect(viewAfterUpdate).toMatchObject([
			{
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				snapshot_content: {
					value: "hello world - updated",
				},
			},
		]);

		// Test DELETE via lix_internal_state_vtable
		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e0")
			.where(
				"version_id",
				"=",
				db.selectFrom("active_version").select("version_id")
			)
			.where("schema_key", "=", "mock_schema")
			.execute();

		const viewAfterDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.where("snapshot_content", "is not", null)
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(viewAfterDelete).toHaveLength(0);
	}
);

simulationTest(
	"writer_key persists on insert/update and clears on update without writer",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema_writer",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: { value: { type: "string" } },
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const ME = "testapp:state#me";

		// Insert with writer via withWriterKey helper
		await withWriterKey(db, ME, (trx) =>
			trx
				.insertInto("lix_internal_state_vtable")
				.values({
					entity_id: "w1",
					file_id: "f1",
					schema_key: "mock_schema_writer",
					plugin_key: "test_plugin",
					schema_version: "1.0",
					version_id: sql`(SELECT version_id FROM active_version)`,
					snapshot_content: JSON.stringify({ value: "A" }),
					untracked: 0,
				})
				.execute()
		);

		const afterInsert = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "w1")
			.orderBy("entity_id")
			.select([
				"entity_id",
				sql`writer_key`.as("writer_key"),
				sql`json(snapshot_content)`.as("snapshot_content"),
			])
			.executeTakeFirstOrThrow();
		expectDeterministic(afterInsert.writer_key).toBe(ME);
		expectDeterministic(afterInsert.snapshot_content).toEqual({ value: "A" });

		// Update with different writer via withWriterKey helper
		await withWriterKey(db, `${ME}-2`, (trx) =>
			trx
				.updateTable("lix_internal_state_vtable")
				.set({ snapshot_content: JSON.stringify({ value: "B" }) })
				.where("entity_id", "=", "w1")
				.where("schema_key", "=", "mock_schema_writer")
				.where("file_id", "=", "f1")
				.execute()
		);

		const afterUpdateWithWriter = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "w1")
			.orderBy("entity_id")
			.select([
				sql`writer_key`.as("writer_key"),
				sql`json(snapshot_content)`.as("snapshot_content"),
			])
			.executeTakeFirstOrThrow();
		expectDeterministic(afterUpdateWithWriter.writer_key).toBe(`${ME}-2`);
		expectDeterministic(afterUpdateWithWriter.snapshot_content).toEqual({
			value: "B",
		});

		// Update WITHOUT writer_key should clear writer (delete writer row)
		await db
			.updateTable("lix_internal_state_vtable")
			.set({ snapshot_content: JSON.stringify({ value: "C" }) })
			.where("entity_id", "=", "w1")
			.where("schema_key", "=", "mock_schema_writer")
			.where("file_id", "=", "f1")
			.execute();

		const afterUpdateNoWriter = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "w1")
			.orderBy("entity_id")
			.select([
				sql`writer_key`.as("writer_key"),
				sql`json(snapshot_content)`.as("snapshot_content"),
			])
			.executeTakeFirstOrThrow();
		expectDeterministic(afterUpdateNoWriter.writer_key).toBeNull();
		expectDeterministic(afterUpdateNoWriter.snapshot_content).toEqual({
			value: "C",
		});
	}
);

simulationTest(
	"writer_key on delete: provided writer retained on tombstone; missing writer clears",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema_writer_del",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: { value: { type: "string" } },
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const ME = "testapp:state#me";

		// Insert tracked row (no writer yet)
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "wd1",
				file_id: "fd",
				schema_key: "mock_schema_writer_del",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({ value: "L" }),
				untracked: 0,
			})
			.execute();

		// Delete WITH writer via withWriterKey helper
		await withWriterKey(db, `${ME}-del`, (trx) =>
			trx
				.deleteFrom("lix_internal_state_vtable")
				.where("entity_id", "=", "wd1")
				.where("schema_key", "=", "mock_schema_writer_del")
				.where("file_id", "=", "fd")
				.where(
					"version_id",
					"=",
					trx.selectFrom("active_version").select("version_id")
				)
				.execute()
		);

		const tombstoneWithWriter = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "wd1")
			.where("schema_key", "=", "mock_schema_writer_del")
			.where("file_id", "=", "fd")
			.orderBy("entity_id")
			.select([sql`writer_key`.as("writer_key"), "snapshot_content"])
			.executeTakeFirstOrThrow();
		expectDeterministic(tombstoneWithWriter.snapshot_content).toBeNull();
		expectDeterministic(tombstoneWithWriter.writer_key).toBe(`${ME}-del`);

		// Recreate and delete WITHOUT writer -> writer row cleared
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "wd1",
				file_id: "fd",
				schema_key: "mock_schema_writer_del",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({ value: "X" }),
				untracked: 0,
			})
			.execute();
		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "wd1")
			.where("schema_key", "=", "mock_schema_writer_del")
			.where("file_id", "=", "fd")
			.where(
				"version_id",
				"=",
				db.selectFrom("active_version").select("version_id")
			)
			.execute();

		const tombstoneNoWriter = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "wd1")
			.where("schema_key", "=", "mock_schema_writer_del")
			.where("file_id", "=", "fd")
			.orderBy("entity_id")
			.select([sql`writer_key`.as("writer_key"), "snapshot_content"])
			.executeTakeFirstOrThrow();
		expectDeterministic(tombstoneNoWriter.snapshot_content).toBeNull();
		expectDeterministic(tombstoneNoWriter.writer_key).toBeNull();
	}
);

simulationTest(
	"inheritance exposes parent writer when child has no local writer; child override replaces",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema_writer_inherit",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: { value: { type: "string" } },
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const child = await createVersion({ lix, name: "child" });
		const P = "app:state#parent";
		const C = "app:state#child";

		// Insert in parent with writer P
		await withWriterKey(db, P, (trx) =>
			trx
				.insertInto("lix_internal_state_vtable")
				.values({
					entity_id: "wi1",
					file_id: "fi1",
					schema_key: "mock_schema_writer_inherit",
					plugin_key: "tp",
					schema_version: "1.0",
					version_id: "global",
					snapshot_content: JSON.stringify({ value: "parent" }),
					untracked: 0,
				})
				.execute()
		);

		// Child inherits content; should expose parent's writer_key
		const inherited = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "wi1")
			.where("version_id", "=", child.id)
			.orderBy("entity_id")
			.select([
				sql`writer_key`.as("writer_key"),
				sql`json(snapshot_content)`.as("snapshot_content"),
				"inherited_from_version_id",
			])
			.executeTakeFirstOrThrow();
		expectDeterministic(inherited.snapshot_content).toEqual({
			value: "parent",
		});
		expectDeterministic(inherited.inherited_from_version_id).toBe("global");
		expectDeterministic(inherited.writer_key).toBe(P);

		// Now override in child with its own writer C
		await withWriterKey(db, C, (trx) =>
			trx
				.insertInto("lix_internal_state_vtable")
				.values({
					entity_id: "wi1",
					file_id: "fi1",
					schema_key: "mock_schema_writer_inherit",
					plugin_key: "tp",
					schema_version: "1.0",
					version_id: child.id,
					snapshot_content: JSON.stringify({ value: "child" }),
					untracked: 0,
				})
				.execute()
		);

		const childNow = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "wi1")
			.where("version_id", "=", child.id)
			.orderBy("entity_id")
			.select([
				sql`writer_key`.as("writer_key"),
				sql`json(snapshot_content)`.as("snapshot_content"),
				"inherited_from_version_id",
			])
			.executeTakeFirstOrThrow();
		expectDeterministic(childNow.snapshot_content).toEqual({ value: "child" });
		expectDeterministic(childNow.inherited_from_version_id).toBeNull();
		expectDeterministic(childNow.writer_key).toBe(C);
	}
);

simulationTest(
	"writer_key exposed on state/state_all/state_with_tombstones",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema_writer_views",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: { value: { type: "string" } },
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const ME = "app:state#me";

		// Insert with writer via withWriterKey helper
		await withWriterKey(db, ME, (trx) =>
			trx
				.insertInto("lix_internal_state_vtable")
				.values({
					entity_id: "vw1",
					file_id: "fv",
					schema_key: "mock_schema_writer_views",
					plugin_key: "tp",
					schema_version: "1.0",
					version_id: sql`(SELECT version_id FROM active_version)`,
					snapshot_content: JSON.stringify({ value: "X" }),
					untracked: 0,
				})
				.execute()
		);

		// state_all
		const sAll = await db
			.selectFrom("state_all")
			.where("entity_id", "=", "vw1")
			.select(["entity_id", sql`writer_key`.as("writer_key")])
			.executeTakeFirstOrThrow();
		expectDeterministic(sAll.writer_key).toBe(ME);

		// state (active)
		const s = await db
			.selectFrom("state")
			.where("entity_id", "=", "vw1")
			.select(["entity_id", sql`writer_key`.as("writer_key")])
			.executeTakeFirstOrThrow();
		expectDeterministic(s.writer_key).toBe(ME);

		// state_with_tombstones should expose writer_key as well
		const swt = await db
			.selectFrom("state_with_tombstones")
			.where("entity_id", "=", "vw1")
			.select(["entity_id", sql`writer_key`.as("writer_key")])
			.executeTakeFirstOrThrow();
		expectDeterministic(swt.writer_key).toBe(ME);
	}
);

simulationTest(
	"exposes tracked deletions as tombstones (NULL snapshot_content)",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema_tombstone",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert a tracked row via the vtable into the active version
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "e_tomb",
				file_id: "f_tomb",
				schema_key: "mock_schema_tombstone",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({ value: "live" }),
				untracked: 0,
			})
			.execute();

		// Delete it via the vtable in the active version (creates a tracked tombstone)
		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e_tomb")
			.where("schema_key", "=", "mock_schema_tombstone")
			.where("file_id", "=", "f_tomb")
			.where(
				"version_id",
				"=",
				db.selectFrom("active_version").select("version_id")
			)
			.execute();

		// Default filter (snapshot_content IS NOT NULL) would hide the deletion; ensure tombstone is exposed
		const rows = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e_tomb")
			.where("schema_key", "=", "mock_schema_tombstone")
			.where("file_id", "=", "f_tomb")
			.orderBy("entity_id")
			.select([
				"entity_id",
				"schema_key",
				"file_id",
				"version_id",
				"change_id",
				"commit_id",
				"snapshot_content",
			])
			.execute();

		expectDeterministic(rows).toHaveLength(1);
		expectDeterministic(rows[0]?.snapshot_content).toBeNull();
		expectDeterministic(rows[0]?.change_id).toBeTruthy();
		expectDeterministic(rows[0]?.commit_id).toBeTruthy();
	}
);

simulationTest(
	"delete ALL via vtable should delete untracked entities in active version",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_test_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		// Create a tracked entity in active version
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "tracked-entity",
				schema_key: "mock_test_schema",
				file_id: "test-file",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({ value: "tracked" }),
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				untracked: 0,
			})
			.execute();

		// Create an untracked entity in active version
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "untracked-entity",
				schema_key: "mock_test_schema",
				file_id: "test-file",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({ value: "untracked" }),
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				untracked: 1,
			})
			.execute();

		// Verify both exist in vtable
		const beforeDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_test_schema")
			.orderBy("entity_id")
			.select(["entity_id"])
			.execute();
		expectDeterministic(beforeDelete).toHaveLength(2);

		// Delete all entities of schema in active version
		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_test_schema")
			.where(
				"version_id",
				"=",
				db.selectFrom("active_version").select("version_id")
			)
			.execute();

		// Check both were deleted in vtable
		const afterDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_test_schema")
			.where("snapshot_content", "is not", null)
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expectDeterministic(afterDelete).toHaveLength(0);
	}
);

simulationTest(
	"delete via vtable with WHERE should delete only untracked entities in active version",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_test_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		// Create a tracked entity in active version
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "tracked-entity",
				schema_key: "mock_test_schema",
				file_id: "test-file",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({ value: "tracked" }),
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				untracked: 0,
			})
			.execute();

		// Create an untracked entity in active version
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "untracked-entity",
				schema_key: "mock_test_schema",
				file_id: "test-file",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({ value: "untracked" }),
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				untracked: 1,
			})
			.execute();

		// Verify both exist in the vtable
		const beforeDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_test_schema")
			.orderBy("entity_id")
			.select(["entity_id"])
			.execute();
		expectDeterministic(beforeDelete).toHaveLength(2);

		// Delete the untracked entity by id in active version
		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "untracked-entity")
			.where(
				"version_id",
				"=",
				db.selectFrom("active_version").select("version_id")
			)
			.execute();

		// Should only have the tracked entity remaining
		const afterDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_test_schema")
			.orderBy("entity_id")
			.select(["entity_id"])
			.execute();
		expectDeterministic(afterDelete).toHaveLength(1);
		expectDeterministic(afterDelete[0]?.entity_id).toBe("tracked-entity");

		// Confirm the untracked entry is gone in vtable
		const stateAfterDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "untracked-entity")
			.where("schema_key", "=", "mock_test_schema")
			.orderBy("entity_id")
			.selectAll()
			.execute();
		expectDeterministic(stateAfterDelete).toHaveLength(0);
	}
);

// see https://github.com/opral/lix-sdk/issues/359
simulationTest(
	"commit_id in state should be from the real auto-commit, not the working commit",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Get the active version with its commit_id and working_commit_id
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Verify we have both commit_id and working_commit_id
		expectDeterministic(activeVersion.commit_id).toBeTruthy();
		expectDeterministic(activeVersion.working_commit_id).toBeTruthy();
		expectDeterministic(activeVersion.commit_id).not.toBe(
			activeVersion.working_commit_id
		);

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const testSchema: LixSchemaDefinition = {
			"x-lix-key": "test_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: testSchema })
			.execute();

		const commitsBeforeInsert = await lix.db
			.selectFrom("commit")
			.select("id")
			.execute();

		// Insert some state data via lix_internal_state_vtable
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "test-entity-1",
				schema_key: "test_schema",
				file_id: "test-file",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({ value: "initial value" }),
				version_id: sql`(SELECT version_id FROM active_version)`,
				untracked: 0,
			})
			.execute();

		const activeVersionAfterInsert = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// expect the version to be identical
		expectDeterministic(activeVersionAfterInsert).toBeDefined();

		// Query to check the commit_id via vtable
		const stateAfterInsert = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "test-entity-1")
			.orderBy("entity_id")
			.select(["entity_id", "commit_id"])
			.executeTakeFirstOrThrow();

		expectDeterministic(stateAfterInsert).toBeDefined();

		// The commit_id should NOT be the working_commit_id
		expectDeterministic(stateAfterInsert.commit_id).not.toBe(
			activeVersionAfterInsert.working_commit_id
		);

		// The commit_id should be the auto-commit ID (not the working commit)
		expectDeterministic(stateAfterInsert.commit_id).toBe(
			activeVersionAfterInsert.commit_id
		);

		const commitsAfterInsert = await lix.db
			.selectFrom("commit")
			.select("id")
			.execute();

		expectDeterministic(commitsAfterInsert.length).toBe(
			commitsBeforeInsert.length + 1
		);

		// Update the state via vtable to trigger another auto-commit
		await db
			.updateTable("lix_internal_state_vtable")
			.where("entity_id", "=", "test-entity-1")
			.set({ snapshot_content: JSON.stringify({ value: "updated value" }) })
			.execute();

		// Check again
		const stateAfterUpdate = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "test-entity-1")
			.orderBy("entity_id")
			.select(["entity_id", "commit_id"])
			.executeTakeFirstOrThrow();

		const activeVersionAfterUpdate = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// The commit_id should now be the new auto-commit ID
		expectDeterministic(stateAfterUpdate.commit_id).toBe(
			activeVersionAfterUpdate.commit_id
		);
		expectDeterministic(stateAfterUpdate.commit_id).not.toBe(
			activeVersion.working_commit_id
		);
	}
);

simulationTest(
	"metadata on committed state rows is preserved",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const selectStateMetadata = async () =>
			await lix.db
				.selectFrom("state_all")
				.where("entity_id", "=", "meta-entity")
				.where("schema_key", "=", "lix_key_value")
				.select(["metadata"])
				.executeTakeFirstOrThrow();

		const selectChangeMetadata = async () =>
			await lix.db
				.selectFrom("change")
				.where("entity_id", "=", "meta-entity")
				.where("schema_key", "=", "lix_key_value")
				.orderBy("created_at", "desc")
				.select(["metadata"])
				.executeTakeFirstOrThrow();

		// Perform a regular insert via the public state view
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "meta-entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: { key: "meta", value: "value" } as any,
				schema_version: "1.0",
				metadata: { foo: "bar" },
			})
			.execute();

		expect((await selectStateMetadata()).metadata).toEqual({ foo: "bar" });
		expect((await selectChangeMetadata()).metadata).toEqual({ foo: "bar" });

		// Updating metadata via state should persist the new value
		await lix.db
			.updateTable("state")
			.set({ metadata: { foo: "baz" } as any })
			.where("entity_id", "=", "meta-entity")
			.where("schema_key", "=", "lix_key_value")
			.where("file_id", "=", "lix")
			.execute();

		expect((await selectStateMetadata()).metadata).toEqual({ foo: "baz" });
		expect((await selectChangeMetadata()).metadata).toEqual({ foo: "baz" });

		// Partially update metadata using SQL JSON helpers
		await lix.db
			.updateTable("state")
			.set(({ eb }) => ({
				metadata: sql<string>`json_set(${eb.ref("metadata")}, '$.bar', 'qux')`,
			}))
			.where("entity_id", "=", "meta-entity")
			.where("schema_key", "=", "lix_key_value")
			.where("file_id", "=", "lix")
			.execute();

		expect((await selectStateMetadata()).metadata).toEqual({
			foo: "baz",
			bar: "qux",
		});
		expect((await selectChangeMetadata()).metadata).toEqual({
			foo: "baz",
			bar: "qux",
		});

		// Clearing metadata via state should propagate null
		await lix.db
			.updateTable("state")
			.set({ metadata: null })
			.where("entity_id", "=", "meta-entity")
			.where("schema_key", "=", "lix_key_value")
			.where("file_id", "=", "lix")
			.execute();

		expect((await selectStateMetadata()).metadata).toBeNull();
		expect((await selectChangeMetadata()).metadata).toBeNull();
	},
	{ simulations: [normalSimulation] }
);
simulationTest(
	"untracked state in child overrides inherited untracked state",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const childVersion = await createVersion({ lix, name: "child" });

		// 1. Insert untracked state in global version
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "untracked_override_test",
				file_id: "f1",
				schema_key: "mock_schema",
				plugin_key: "p1",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({ value: "global untracked" }),
				version_id: "global",
				untracked: 1,
			})
			.execute();

		// 2. Verify child inherits untracked state
		const inheritedState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "untracked_override_test")
			.where("version_id", "=", childVersion.id)
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content"), "untracked"])
			.execute();

		expectDeterministic(inheritedState).toHaveLength(1);
		expectDeterministic(inheritedState[0]?.snapshot_content).toEqual({
			value: "global untracked",
		});
		expectDeterministic(inheritedState[0]?.untracked).toBe(1);

		// 3. Insert untracked state in child version for same entity
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "untracked_override_test",
				file_id: "f1",
				schema_key: "mock_schema",
				plugin_key: "p1",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({ value: "child untracked" }),
				version_id: childVersion.id,
				untracked: 1,
			})
			.execute();

		// 4. Verify child now sees its own untracked state
		const finalState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "untracked_override_test")
			.where("version_id", "=", childVersion.id)
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content"), "untracked"])
			.execute();

		expectDeterministic(finalState).toHaveLength(1);
		expectDeterministic(finalState[0]?.snapshot_content).toEqual({
			value: "child untracked",
		});
		expectDeterministic(finalState[0]?.untracked).toBe(1);
	}
);
simulationTest(
	"tracked state in child overrides inherited untracked state",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const childVersion = await createVersion({ lix, name: "child" });

		// 1. Insert untracked state in global version
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "override_test",
				file_id: "f1",
				schema_key: "mock_schema",
				plugin_key: "p1",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({ value: "global untracked" }),
				version_id: "global",
				untracked: 1,
			})
			.execute();

		// 2. Verify child inherits untracked state
		const inheritedState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "override_test")
			.where("version_id", "=", childVersion.id)
			.orderBy("entity_id")
			.select([
				sql`json(snapshot_content)`.as("snapshot_content"),
				"untracked",
				"inherited_from_version_id",
			])
			.execute();

		expectDeterministic(inheritedState).toHaveLength(1);
		expectDeterministic(inheritedState[0]?.snapshot_content).toEqual({
			value: "global untracked",
		});
		expectDeterministic(inheritedState[0]?.untracked).toBe(1);
		expectDeterministic(inheritedState[0]?.inherited_from_version_id).toBe(
			"global"
		);

		// 3. Insert tracked state in child version for same entity
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "override_test",
				file_id: "f1",
				schema_key: "mock_schema",
				plugin_key: "p1",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({ value: "child tracked" }),
				version_id: childVersion.id,
				untracked: 0,
			})
			.execute();

		// 4. Verify child now sees tracked state, not inherited untracked
		const finalState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "override_test")
			.where("version_id", "=", childVersion.id)
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content"), "untracked"])
			.execute();

		expectDeterministic(finalState).toHaveLength(1);
		expectDeterministic(finalState[0]?.snapshot_content).toEqual({
			value: "child tracked",
		});
		expectDeterministic(finalState[0]?.untracked).toBe(0); // Should be tracked
	}
);
simulationTest(
	"untracked state has untracked change_id for both inherited and non-inherited entities",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const childVersion = await createVersion({ lix, name: "child" });

		// 1. Insert untracked state in global version (will be inherited by child)
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "inherited-entity",
				file_id: "test-file",
				schema_key: "mock_schema",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({ value: "global untracked" }),
				version_id: "global",
				untracked: 1,
			})
			.execute();

		// 2. Insert untracked state directly in child version (non-inherited)
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "non-inherited-entity",
				file_id: "test-file",
				schema_key: "mock_schema",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({ value: "child untracked" }),
				version_id: childVersion.id,
				untracked: 1,
			})
			.execute();

		// 3. Query all untracked entities in child version
		const untrackedEntities = await db
			.selectFrom("lix_internal_state_vtable")
			.where("version_id", "=", childVersion.id)
			.where("entity_id", "in", ["inherited-entity", "non-inherited-entity"])
			.where("untracked", "=", 1)
			.orderBy("_pk")
			.select(["entity_id", "change_id"])
			.execute();

		expectDeterministic(untrackedEntities).toHaveLength(2);

		// 4. Check that both entities have untracked change_id
		for (const entity of untrackedEntities) {
			expectDeterministic(entity.change_id).toBe("untracked");
		}

		// 5. Verify specific entities
		const inheritedEntity = untrackedEntities.find(
			(e) => e.entity_id === "inherited-entity"
		);
		const nonInheritedEntity = untrackedEntities.find(
			(e) => e.entity_id === "non-inherited-entity"
		);

		expectDeterministic(inheritedEntity).toBeDefined();
		expectDeterministic(nonInheritedEntity).toBeDefined();

		// Both inherited and non-inherited untracked entities should have change_id = "untracked"
		expectDeterministic(inheritedEntity?.change_id).toBe("untracked");
		expectDeterministic(nonInheritedEntity?.change_id).toBe("untracked");
	}
);
simulationTest(
	"lix_internal_state_vtable inherits untracked state from parent version into child",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Get active child version id
		const activeVersion = await db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Insert untracked entity into global version (parent)
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				file_id: "test-file",
				schema_key: "mock_schema",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				entity_id: "test_key",
				snapshot_content: JSON.stringify({ value: "test_value" }),
				version_id: "global",
				untracked: 1,
			})
			.execute();

		// Read from global (parent)
		const globalState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "test_key")
			.where("version_id", "=", "global")
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content")])
			.executeTakeFirstOrThrow();

		expectDeterministic(globalState).toBeDefined();

		// Read from child active version (should inherit from global)
		const versionState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "test_key")
			.where("version_id", "=", activeVersion.id)
			.orderBy("entity_id")
			.select([
				sql`json(snapshot_content)`.as("snapshot_content"),
				"inherited_from_version_id",
			])
			.executeTakeFirstOrThrow();

		expectDeterministic(versionState).toBeDefined();
		expectDeterministic(versionState.snapshot_content).toEqual(
			globalState.snapshot_content
		);
		expectDeterministic(versionState.inherited_from_version_id).toBe("global");
	}
);
simulationTest(
	"untracked state overrides inherited state (untracked > inherited)",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Step 1: Insert entity in global version (tracked)
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "inherited-entity",
				file_id: "test-file",
				schema_key: "mock_schema",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				version_id: "global",
				snapshot_content: JSON.stringify({ value: "inherited value" }),
				untracked: 0,
			})
			.execute();

		// Step 2: Create a child version that inherits from global
		const childVersion = await createVersion({ lix, name: "child-version" });

		// Verify inheritance is set up correctly
		expectDeterministic(childVersion.inherits_from_version_id).toBe("global");

		// Step 3: Verify child initially sees inherited entity
		const inheritedState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "inherited-entity")
			.where("version_id", "=", childVersion.id)
			.orderBy("entity_id")
			.select([
				sql`json(snapshot_content)`.as("snapshot_content"),
				"inherited_from_version_id",
			])
			.execute();

		expectDeterministic(inheritedState).toHaveLength(1);
		expectDeterministic(inheritedState[0]?.snapshot_content).toEqual({
			value: "inherited value",
		});
		expectDeterministic(inheritedState[0]?.inherited_from_version_id).toBe(
			"global"
		);

		// Step 4: Add untracked state for same entity in child version
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "inherited-entity",
				file_id: "test-file",
				schema_key: "mock_schema",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				version_id: childVersion.id,
				snapshot_content: JSON.stringify({ value: "untracked override" }),
				untracked: 1,
			})
			.execute();

		// Step 5: Query should return untracked state (higher priority than inherited)
		const finalState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "inherited-entity")
			.where("version_id", "=", childVersion.id)
			.orderBy("entity_id")
			.select([
				sql`json(snapshot_content)`.as("snapshot_content"),
				"inherited_from_version_id",
				"version_id",
			])
			.execute();

		expectDeterministic(finalState).toHaveLength(1);
		expectDeterministic(finalState[0]?.snapshot_content).toEqual({
			value: "untracked override",
		});
		expectDeterministic(finalState[0]?.inherited_from_version_id).toBe(null);
		expectDeterministic(finalState[0]?.version_id).toBe(childVersion.id);

		// Step 6: Verify the inherited entity still exists in global version (unchanged)
		const globalState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "inherited-entity")
			.where("version_id", "=", "global")
			.orderBy("entity_id")
			.select([
				sql`json(snapshot_content)`.as("snapshot_content"),
				"inherited_from_version_id",
			])
			.execute();

		expectDeterministic(globalState).toHaveLength(1);
		expectDeterministic(globalState[0]?.snapshot_content).toEqual({
			value: "inherited value",
		});
		expectDeterministic(globalState[0]?.inherited_from_version_id).toBe(null);

		// Step 7: No changes should be created for untracked mutations
		const changes = await db
			.selectFrom("change")
			.where("entity_id", "=", "inherited-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expectDeterministic(changes).toHaveLength(1);
	}
);
simulationTest(
	"untracked state has highest priority in UNION (untracked > tracked > inherited)",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "string",
				},
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Step 1: Insert tracked state with "init"
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "entity0",
				file_id: "test-file",
				schema_key: "mock_schema",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({ value: "init" }),
				untracked: 0,
			})
			.execute();

		// Verify tracked state exists
		const afterInit = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "entity0")
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content")])
			.execute();

		expectDeterministic(afterInit).toHaveLength(1);
		expectDeterministic(afterInit[0]?.snapshot_content).toEqual({
			value: "init",
		});

		// Step 2: Update to untracked state with "update" (should NOT delete tracked state)
		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({ value: "update" }),
				untracked: 1,
			})
			.where("entity_id", "=", "entity0")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "test-file")
			.execute();

		// Step 3: Query should return untracked state "update" (highest priority)
		const afterUntrackedUpdate = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "entity0")
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content")])
			.execute();

		expectDeterministic(afterUntrackedUpdate).toHaveLength(1);
		expectDeterministic(afterUntrackedUpdate[0]?.snapshot_content).toEqual({
			value: "update",
		});

		// Step 4: Update back to tracked state with "update2" (should delete untracked state)
		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({ value: "update2" }),
				untracked: 0,
			})
			.where("entity_id", "=", "entity0")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "test-file")
			.execute();

		// Step 5: Query should return tracked state "update2"
		const afterTrackedUpdate = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "entity0")
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content")])
			.execute();

		expectDeterministic(afterTrackedUpdate).toHaveLength(1);
		expectDeterministic(afterTrackedUpdate[0]?.snapshot_content).toEqual({
			value: "update2",
		});

		// Verify that a change was created for the final tracked mutation
		const changes = await db
			.selectFrom("change")
			.where("entity_id", "=", "entity0")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expectDeterministic(changes.length).toBeGreaterThan(0);
	}
);
simulationTest(
	"deleting without filtering for the version_id deletes the entity from all versions",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Insert an entity into global version via vtable
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const testSchema: LixSchemaDefinition = {
			"x-lix-key": "test_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id", "name"],
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: testSchema })
			.execute();

		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "shared-entity",
				file_id: "test-file",
				schema_key: "test_schema",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({
					id: "shared-entity",
					name: "Global Entity",
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: 0,
			})
			.execute();

		// Create a child version that inherits from global
		const childVersion = await createVersion({
			lix,
			name: "child-version",
			inheritsFrom: { id: "global" },
		});

		// Verify inheritance - both global and child should see the entity via vtable
		const beforeDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "in", ["global", childVersion.id])
			.orderBy("entity_id")
			.select([
				"entity_id",
				"version_id",
				"inherited_from_version_id",
				sql`json(snapshot_content)`.as("snapshot_content"),
			])
			.execute();

		expectDeterministic(beforeDelete).toHaveLength(2);
		expectDeterministic(beforeDelete).toMatchObject([
			{
				entity_id: "shared-entity",
				version_id: "global",
				inherited_from_version_id: null,
				snapshot_content: { id: "shared-entity", name: "Global Entity" },
			},
			{
				entity_id: "shared-entity",
				version_id: childVersion.id,
				inherited_from_version_id: "global",
				snapshot_content: { id: "shared-entity", name: "Global Entity" },
			},
		]);

		// Delete across versions by not filtering by version_id
		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "shared-entity")
			.where("schema_key", "=", "test_schema")
			.execute();

		const afterDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "shared-entity")
			.where("snapshot_content", "is not", null)
			.orderBy("entity_id")
			.selectAll()
			.execute();

		// Should be deleted from every version
		expectDeterministic(afterDelete).toHaveLength(0);
	}
);

simulationTest(
	"untracked state is persisted across lix openings",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "string",
				},
			},
		};

		// First session - create and insert untracked state via vtable
		const lix1 = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix1.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db1 = lix1.db as unknown as Kysely<LixInternalDatabaseSchema>;

		await db1
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "persistent-entity",
				file_id: "test-file",
				schema_key: "mock_schema",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({
					value: "persistent untracked value",
				}),
				untracked: 1,
			})
			.execute();

		// Second session - verify untracked state persists
		const lix2 = await openLix({ blob: await lix1.toBlob() });

		const db2 = lix2.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const persistedState = await db2
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "persistent-entity")
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content")])
			.execute();

		expectDeterministic(persistedState).toHaveLength(1);
		expectDeterministic(persistedState[0]?.snapshot_content).toEqual({
			value: "persistent untracked value",
		});

		await lix2.close();
	}
);

simulationTest(
	"child version inherits entities from parent version",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const testSchema: LixSchemaDefinition = {
			"x-lix-key": "test_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id", "name"],
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: testSchema })
			.execute();

		// Insert an entity into global version
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "global-entity-1",
				file_id: "test-file",
				schema_key: "test_schema",
				plugin_key: "test_plugin",
				version_id: "global",
				snapshot_content: {
					id: "global-entity-1",
					name: "Global Entity",
				},
				schema_version: "1.0",
			})
			.execute();

		// Create a child version that inherits from global
		const childVersion = await createVersion({
			lix,
			name: "child-version",
		});

		// Verify inheritance was set up correctly
		expectDeterministic(childVersion.inherits_from_version_id).toBe("global");

		// The child version should inherit the entity from global
		const inheritedEntity = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "global-entity-1")
			.where("version_id", "=", childVersion.id)
			.selectAll()
			.execute();

		// This should pass - the entity should be visible in the child version via inheritance
		expectDeterministic(inheritedEntity).toHaveLength(1);
		expectDeterministic(inheritedEntity[0]?.entity_id).toBe("global-entity-1");
		expectDeterministic(inheritedEntity[0]?.version_id).toBe(childVersion.id); // Should return child version ID
		expectDeterministic(inheritedEntity[0]?.inherited_from_version_id).toBe(
			"global"
		); // Should track inheritance source
		expectDeterministic(inheritedEntity[0]?.snapshot_content).toEqual({
			id: "global-entity-1",
			name: "Global Entity",
		});
	}
);

simulationTest(
	"child version inherits then overrides with own entity",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const testSchema: LixSchemaDefinition = {
			"x-lix-key": "test_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				id: { type: "string" },
				name: { type: "string" },
				count: { type: "number" },
			},
			required: ["id", "name", "count"],
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: testSchema })
			.execute();

		// Insert an entity into global version
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "shared-entity",
				file_id: "test-file",
				schema_key: "test_schema",
				plugin_key: "test_plugin",
				version_id: "global",
				snapshot_content: {
					id: "shared-entity",
					name: "Original Global Value",
					count: 1,
				},
				schema_version: "1.0",
			})
			.execute();

		// Create a child version that inherits from global
		const childVersion = await createVersion({
			lix,
			id: "child-version",
			inheritsFrom: { id: "global" },
		});

		// Verify the child initially sees the inherited entity
		const inheritedEntity = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", childVersion.id)
			.selectAll()
			.execute();

		expectDeterministic(inheritedEntity).toHaveLength(1);
		expectDeterministic(inheritedEntity[0]?.version_id).toBe(childVersion.id);
		expectDeterministic(inheritedEntity[0]?.inherited_from_version_id).toBe(
			"global"
		);
		expectDeterministic(inheritedEntity[0]?.snapshot_content).toEqual({
			id: "shared-entity",
			name: "Original Global Value",
			count: 1,
		});

		// Now modify the entity in the child version (copy-on-write)
		await lix.db
			.updateTable("state_all")
			.set({
				snapshot_content: {
					id: "shared-entity",
					name: "Modified in Child Version",
					count: 2,
				},
			})
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", childVersion.id)
			.execute();

		// Verify the child now has its own version of the entity
		const childEntity = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", childVersion.id)
			.selectAll()
			.execute();

		expectDeterministic(childEntity).toHaveLength(1);
		expectDeterministic(childEntity[0]?.version_id).toBe(childVersion.id);
		expectDeterministic(childEntity[0]?.inherited_from_version_id).toBe(null); // No longer inherited
		expectDeterministic(childEntity[0]?.snapshot_content).toEqual({
			id: "shared-entity",
			name: "Modified in Child Version",
			count: 2,
		});

		// Verify the global version still has the original value
		const globalEntity = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", "global")
			.selectAll()
			.execute();

		expectDeterministic(globalEntity).toHaveLength(1);
		expectDeterministic(globalEntity[0]?.version_id).toBe("global");
		expectDeterministic(globalEntity[0]?.inherited_from_version_id).toBe(null);
		expectDeterministic(globalEntity[0]?.snapshot_content).toEqual({
			id: "shared-entity",
			name: "Original Global Value",
			count: 1,
		});

		// Verify we now have 2 separate entities (one in global, one in child)
		const allEntities = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "in", ["global", childVersion.id])
			.orderBy("version_id", "asc")
			.selectAll()
			.execute();

		expectDeterministic(allEntities).toHaveLength(2);

		// Child version entity (modified)
		expectDeterministic(allEntities[0]?.version_id).toBe(childVersion.id);
		expectDeterministic(allEntities[0]?.inherited_from_version_id).toBe(null);
		expectDeterministic(allEntities[0]?.snapshot_content).toEqual({
			id: "shared-entity",
			name: "Modified in Child Version",
			count: 2,
		});

		// Global version entity (original)
		expectDeterministic(allEntities[1]?.version_id).toBe("global");
		expectDeterministic(allEntities[1]?.inherited_from_version_id).toBe(null);
		expectDeterministic(allEntities[1]?.snapshot_content).toEqual({
			id: "shared-entity",
			name: "Original Global Value",
			count: 1,
		});
	}
);

simulationTest(
	"child version deletes inherited entity via copy-on-write",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "test_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
		};

		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Insert schema
		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		// Insert an entity into global version
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "shared-entity",
				file_id: "test-file",
				schema_key: "test_schema",
				plugin_key: "test_plugin",
				version_id: "global",
				snapshot_content: {
					id: "shared-entity",
					name: "shared Entity",
				},
				schema_version: "1.0",
			})
			.execute();

		// Verify the child initially sees the inherited entity
		const inheritedEntity = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", activeVersion.id)
			.selectAll()
			.execute();

		expectDeterministic(inheritedEntity).toHaveLength(1);
		expectDeterministic(inheritedEntity[0]?.version_id).toBe(activeVersion.id);
		expectDeterministic(inheritedEntity[0]?.inherited_from_version_id).toBe(
			"global"
		);

		// Delete the inherited entity in child version (should create copy-on-write deletion)
		await lix.db
			.deleteFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", activeVersion.id)
			.execute();

		// Verify the entity is deleted in child version
		const childEntityAfterDelete = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", activeVersion.id)
			.selectAll()
			.execute();

		// Entity should be deleted in child version (copy-on-write deletion)
		expectDeterministic(childEntityAfterDelete).toHaveLength(0);

		// Verify the entity still exists in global version (not affected by child deletion)
		const inheritedEntityAfterDelete = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", "global")
			.selectAll()
			.execute();

		expectDeterministic(inheritedEntityAfterDelete).toHaveLength(1);
		expectDeterministic(
			inheritedEntityAfterDelete[0]?.snapshot_content
		).toEqual({
			id: "shared-entity",
			name: "shared Entity",
		});

		// Verify we now only see the global entity through the state view (deletion marker is hidden)
		const allEntities = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.selectAll()
			.execute();

		// Both cache hit and cache miss scenarios should behave identically:
		// copy-on-write deletion hides the entity from child but preserves it in parent
		expectDeterministic(allEntities).toHaveLength(1);
		expectDeterministic(allEntities[0]?.version_id).toBe("global");
		expectDeterministic(allEntities[0]?.inherited_from_version_id).toBe(null); // It's the original global entity
	}
);
simulationTest(
	"delete operations are validated for foreign key constraints",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Define parent schema (referenced entity)
		const parentSchema: LixSchemaDefinition = {
			"x-lix-key": "parent_entity",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id", "name"],
			additionalProperties: false,
		};

		// Define child schema with foreign key to parent
		const childSchema: LixSchemaDefinition = {
			"x-lix-key": "child_entity",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			"x-lix-foreign-keys": [
				{
					properties: ["/parent_id"],
					references: {
						schemaKey: "parent_entity",
						properties: ["/id"],
					},
				},
			],
			type: "object",
			properties: {
				id: { type: "string" },
				parent_id: { type: "string" },
				value: { type: "string" },
			},
			required: ["id", "parent_id", "value"],
			additionalProperties: false,
		};

		// Register both schemas
		await lix.db
			.insertInto("stored_schema")
			.values([{ value: parentSchema }, { value: childSchema }])
			.execute();

		// Insert parent entity
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "parent-1",
				schema_key: "parent_entity",
				file_id: "test-file",
				plugin_key: "test-plugin",
				snapshot_content: {
					id: "parent-1",
					name: "Parent Entity",
				},
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
			})
			.execute();

		// Insert child entity that references the parent
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "child-1",
				schema_key: "child_entity",
				file_id: "test-file",
				plugin_key: "test-plugin",
				snapshot_content: {
					id: "child-1",
					parent_id: "parent-1",
					value: "Child Value",
				},
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
			})
			.execute();

		// Verify both entities exist
		const parentBefore = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "parent-1")
			.where("schema_key", "=", "parent_entity")
			.selectAll()
			.execute();

		const childBefore = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "child-1")
			.where("schema_key", "=", "child_entity")
			.selectAll()
			.execute();

		expectDeterministic(parentBefore).toHaveLength(1);
		expectDeterministic(childBefore).toHaveLength(1);

		// Attempting to delete the parent entity should fail due to foreign key constraint
		// because there's a child entity that references it
		await expect(
			lix.db
				.deleteFrom("state_all")
				.where("entity_id", "=", "parent-1")
				.where("schema_key", "=", "parent_entity")
				.execute()
		).rejects.toThrow(/foreign key/i);

		// Verify the parent still exists after failed deletion attempt
		const parentAfter = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "parent-1")
			.where("schema_key", "=", "parent_entity")
			.selectAll()
			.execute();

		expectDeterministic(parentAfter).toHaveLength(1);
	}
);
simulationTest(
	"validates the schema on insert via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "number",
				},
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Test that invalid data is rejected by lix_internal_state_vtable
		await expect(
			db
				.insertInto("lix_internal_state_vtable")
				.values({
					entity_id: "e0",
					file_id: "f0",
					schema_key: "mock_schema",
					plugin_key: "lix_own_entity",
					schema_version: "1.0",
					snapshot_content: JSON.stringify({
						value: "hello world", // Should be a number, not a string
					}),
					version_id: sql`(SELECT version_id FROM active_version)`,
					untracked: 0,
				})
				.execute()
		).rejects.toThrow(/value must be number/);
	}
);

simulationTest(
	"validates the schema on update via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "number",
				},
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert valid data first
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({
					value: 5,
				}),
				version_id: sql`(SELECT version_id FROM active_version)`,
				untracked: 0,
			})
			.execute();

		// Test that invalid update is rejected by lix_internal_state_vtable
		await expect(
			db
				.updateTable("lix_internal_state_vtable")
				.set({
					snapshot_content: JSON.stringify({
						value: "hello world - updated", // Should be a number, not a string
					}),
				})
				.where("entity_id", "=", "e0")
				.where("schema_key", "=", "mock_schema")
				.where("file_id", "=", "f0")
				.execute()
		).rejects.toThrow(/value must be number/);

		// Verify the data wasn't changed
		const viewAfterFailedUpdate = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.orderBy("entity_id")
			.select([
				"entity_id",
				"file_id",
				"schema_key",
				"plugin_key",
				sql`json(snapshot_content)`.as("snapshot_content"),
			])
			.execute();

		expect(viewAfterFailedUpdate).toMatchObject([
			{
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				snapshot_content: {
					value: 5,
				},
			},
		]);
	}
);

simulationTest(
	"delete operations remove entries from underlying data via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const deleteSchema: LixSchemaDefinition = {
			"x-lix-key": "delete-cache-schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				to: { type: "string" },
			},
			required: ["to"],
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: deleteSchema })
			.execute();

		// Insert initial state via lix_internal_state_vtable
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "delete-cache-entity",
				schema_key: "delete-cache-schema",
				file_id: "delete-cache-file",
				plugin_key: "delete-plugin",
				snapshot_content: JSON.stringify({ to: "delete" }),
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				untracked: 0,
			})
			.execute();

		// Verify data exists
		const beforeDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "delete-cache-entity")
			.orderBy("entity_id")
			.selectAll()
			.execute();
		expect(beforeDelete).toHaveLength(1);

		// Delete the state via lix_internal_state_vtable
		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "delete-cache-entity")
			.where("schema_key", "=", "delete-cache-schema")
			.where("file_id", "=", "delete-cache-file")
			.where("version_id", "=", activeVersion.id)
			.execute();

		// Data should no longer be accessible
		const afterDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "delete-cache-entity")
			.where("snapshot_content", "is not", null)
			.orderBy("entity_id")
			.selectAll()
			.execute();
		expect(afterDelete).toHaveLength(0);
	}
);

simulationTest(
	"write-through cache: insert operations populate cache immediately via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const writeThroughSchema: LixSchemaDefinition = {
			"x-lix-key": "write-through-schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				test: { type: "string" },
			},
			required: ["test"],
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: writeThroughSchema })
			.execute();

		// Insert state data via lix_internal_state_vtable - should populate cache
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "write-through-entity",
				schema_key: "write-through-schema",
				file_id: "write-through-file",
				plugin_key: "write-through-plugin",
				snapshot_content: JSON.stringify({ test: "write-through-data" }),
				schema_version: "1.0",
				version_id: activeVersion.id,
				untracked: 0,
			})
			.execute();

		// Cache should be populated immediately via write-through
		const cacheTable = schemaKeyToCacheTableName("write-through-schema");
		const { rows: cacheRows } = lix.engine!.executeSync({
			sql: `
				SELECT
					*,
					json(snapshot_content) AS snapshot_content
				FROM ${cacheTable}
				WHERE entity_id = ?
					AND schema_key = ?
					AND file_id = ?
					AND version_id = ?
			`,
			parameters: [
				"write-through-entity",
				"write-through-schema",
				"write-through-file",
				activeVersion.id,
			],
		});
		const cacheEntry = cacheRows?.[0];

		expect(cacheEntry).toBeDefined();
		const parsedSnapshot = cacheEntry?.snapshot_content
			? JSON.parse(String(cacheEntry.snapshot_content))
			: null;
		expect(cacheEntry?.entity_id).toBe("write-through-entity");
		expect(cacheEntry?.plugin_key).toBe("write-through-plugin");
		expect(parsedSnapshot).toEqual({
			test: "write-through-data",
		});

		// Virtual table should return the same data
		const stateResults = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "write-through-entity")
			.orderBy("entity_id")
			.select(["entity_id", sql`json(snapshot_content)`.as("snapshot_content")])
			.execute();

		expect(stateResults).toHaveLength(1);
		expect(stateResults[0]?.entity_id).toBe("write-through-entity");
		expect(stateResults[0]?.snapshot_content).toEqual({
			test: "write-through-data",
		});
	},
	{ simulations: [normalSimulation] }
);

simulationTest(
	"write-through cache: update operations update cache immediately via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const updateSchema: LixSchemaDefinition = {
			"x-lix-key": "update-cache-schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				initial: { type: "string" },
				updated: { type: "string" },
			},
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: updateSchema })
			.execute();

		// Insert initial state via lix_internal_state_vtable
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "update-cache-entity",
				schema_key: "update-cache-schema",
				file_id: "update-cache-file",
				plugin_key: "initial-plugin",
				snapshot_content: JSON.stringify({ initial: "value" }),
				schema_version: "1.0",
				version_id: activeVersion.id,
				untracked: 0,
			})
			.execute();

		// Update the state via lix_internal_state_vtable - should update cache
		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({ updated: "value" }),
				plugin_key: "updated-plugin",
			})
			.where("entity_id", "=", "update-cache-entity")
			.where("schema_key", "=", "update-cache-schema")
			.where("file_id", "=", "update-cache-file")
			.where("version_id", "=", activeVersion.id)
			.execute();

		// Cache should be immediately updated
		const updateCacheTable = schemaKeyToCacheTableName("update-cache-schema");
		const { rows: updateCacheRows } = lix.engine!.executeSync({
			sql: `
				SELECT
					*,
					json(snapshot_content) AS snapshot_content
				FROM ${updateCacheTable}
				WHERE entity_id = ?
					AND schema_key = ?
					AND file_id = ?
					AND version_id = ?
			`,
			parameters: [
				"update-cache-entity",
				"update-cache-schema",
				"update-cache-file",
				activeVersion.id,
			],
		});
		const cacheEntry = updateCacheRows?.[0] as
			| {
					plugin_key: string;
					snapshot_content: string | null;
			  }
			| undefined;

		expect(cacheEntry).toBeDefined();
		const updatedSnapshot = cacheEntry?.snapshot_content
			? JSON.parse(String(cacheEntry.snapshot_content))
			: null;
		expect(updatedSnapshot).toEqual({ updated: "value" });
		expect(cacheEntry?.plugin_key).toBe("updated-plugin");

		// Virtual table should return updated data
		const stateResults = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "update-cache-entity")
			.orderBy("entity_id")
			.select([
				sql`json(snapshot_content)`.as("snapshot_content"),
				"plugin_key",
			])
			.execute();

		expect(stateResults).toHaveLength(1);
		expect(stateResults[0]?.snapshot_content).toEqual({ updated: "value" });
		expect(stateResults[0]?.plugin_key).toBe("updated-plugin");
	},
	{ simulations: [normalSimulation] }
);

simulationTest(
	"change.created_at and state timestamps are consistent",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "string",
				},
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		// Insert state data
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "timestamp-test-entity",
				schema_key: "mock_schema",
				file_id: "timestamp-test-file",
				plugin_key: "timestamp-test-plugin",
				snapshot_content: { value: "timestamp test" },
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
			})
			.execute();

		// Get the change record
		const changeRecord = await (
			lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		)
			.selectFrom("lix_internal_change")
			.where("entity_id", "=", "timestamp-test-entity")
			.where("schema_key", "=", "mock_schema")
			.select(["created_at"])
			.executeTakeFirstOrThrow();

		// Get the state cache record
		const timestampCacheTable = schemaKeyToCacheTableName("mock_schema");
		const { rows: timestampCacheRows } = lix.engine!.executeSync({
			sql: `
				SELECT
					created_at,
					updated_at
				FROM ${timestampCacheTable}
				WHERE entity_id = ?
					AND schema_key = ?
			`,
			parameters: ["timestamp-test-entity", "mock_schema"],
		});
		const cacheRecord = timestampCacheRows?.[0];
		expect(cacheRecord).toBeDefined();

		// Verify all timestamps are identical
		expect(changeRecord.created_at).toBe(cacheRecord.created_at);
		expect(changeRecord.created_at).toBe(cacheRecord.updated_at);
	},
	{ simulations: [normalSimulation] }
);

simulationTest(
	"lix_internal_state_vtable exposes change_id for blame and diff functionality",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "string",
				},
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert initial state via lix_internal_state_vtable (tracked)
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "change-id-test-entity",
				file_id: "change-id-test-file",
				schema_key: "mock_schema",
				plugin_key: "change-id-test-plugin",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({ value: "initial value" }),
				untracked: 0,
			})
			.execute();

		// Query lix_internal_state_vtable to verify change_id is exposed
		const initialResult = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "change-id-test-file")
			.orderBy("entity_id")
			.select(["change_id", sql`json(snapshot_content)`.as("snapshot_content")])
			.execute();

		expect(initialResult).toHaveLength(1);
		expect(initialResult[0]?.change_id).toBeDefined();
		expect(typeof initialResult[0]?.change_id).toBe("string");

		// Get the actual change record to verify the change_id
		const changeRecord = await db
			.selectFrom("change")
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.select(["change.id", "snapshot_content"])
			.executeTakeFirstOrThrow();

		expect(initialResult[0]?.change_id).toBe(changeRecord.id);
		expect(changeRecord.snapshot_content).toEqual({ value: "initial value" });
		expect(initialResult[0]?.snapshot_content).toEqual({
			value: "initial value",
		});

		// Update the entity to create a new change via lix_internal_state_vtable
		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({ value: "updated value" }),
			})
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "change-id-test-file")
			.execute();

		// Query again to verify change_id updated after modification
		const updatedResult = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "change-id-test-file")
			.orderBy("entity_id")
			.select(["change_id", sql`json(snapshot_content)`.as("snapshot_content")])
			.execute();

		expect(updatedResult).toHaveLength(1);
		expect(updatedResult[0]?.change_id).toBeDefined();
		expect(updatedResult[0]?.change_id).not.toBe(initialResult[0]?.change_id);

		// Get the new change record by matching the change_id from the updated state
		const newChangeRecord = await db
			.selectFrom("change")
			.where("change.id", "=", updatedResult[0]!.change_id)
			.select(["change.id", "snapshot_content"])
			.executeTakeFirstOrThrow();

		expect(updatedResult[0]?.change_id).toBe(newChangeRecord.id);
		expect(newChangeRecord.snapshot_content).toEqual({
			value: "updated value",
		});
		expect(updatedResult[0]?.snapshot_content).toEqual({
			value: "updated value",
		});
	}
);

simulationTest(
	"exposes commit_id for history queries",
	async ({ expectDeterministic, openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "string",
				},
			},
		};

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		await db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		// Insert initial state using Kysely to ensure virtual table is triggered
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "change-set-id-test-entity",
				schema_key: "mock_schema",
				file_id: "change-set-id-test-file",
				plugin_key: "change-set-id-test-plugin",
				snapshot_content: JSON.stringify({ value: "initial value" }),
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				untracked: 0,
			})
			.execute();

		const activeVersionAfterInsert = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Query state_all view to verify commit_id is exposed
		const stateResult = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "change-set-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expectDeterministic(stateResult).toHaveLength(1);
		expectDeterministic(stateResult[0]).toHaveProperty("commit_id");
		expectDeterministic(stateResult[0]?.commit_id).toBe(
			activeVersionAfterInsert.commit_id
		);

		// Get the change_set_element records - there should be two:
		// 1. One in the working change set
		// 2. One in the version's current change set (after commit)
		const changeSetElements = await lix.db
			.selectFrom("change_set_element")
			.where("entity_id", "=", "change-set-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "change-set-id-test-file")
			.select(["change_set_id", "change_id"])
			.orderBy("change_set_id")
			.execute();

		expectDeterministic(changeSetElements).toHaveLength(2);

		// Get the version to understand which change sets we're dealing with
		const version = await lix.db
			.selectFrom("version")
			.where("id", "=", activeVersionAfterInsert.id)
			.select(["id", "commit_id", "working_commit_id"])
			.executeTakeFirstOrThrow();

		// Get the change set ID from the version's commit
		const versionCommit = await lix.db
			.selectFrom("commit")
			.where("id", "=", version.commit_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// Get the change set ID from the working commit
		const workingCommit = await lix.db
			.selectFrom("commit")
			.where("id", "=", version.working_commit_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// Find which change_set_element is in the version's change set (not working)
		const versionChangeSetElement = changeSetElements.find(
			(el) => el.change_set_id === versionCommit.change_set_id
		);
		const workingChangeSetElement = changeSetElements.find(
			(el) => el.change_set_id === workingCommit.change_set_id
		);

		expectDeterministic(versionChangeSetElement).toBeDefined();
		expectDeterministic(workingChangeSetElement).toBeDefined();

		// The state view should show the commit_id from the version,
		// not related to the working change set (which is temporary and not part of the graph)
		expectDeterministic(stateResult[0]?.commit_id).toBe(version.commit_id);
		expectDeterministic(stateResult[0]?.commit_id).toBe(version.commit_id);

		// Verify that the change_id also matches for consistency
		expectDeterministic(stateResult[0]?.change_id).toBe(
			versionChangeSetElement!.change_id
		);
		expectDeterministic(stateResult[0]?.change_id).toBe(
			versionChangeSetElement!.change_id
		);
	}
);

simulationTest(
	"transaction table is empty after select, insert, update, delete via lix_internal_state_vtable",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Prepare a simple schema for state mutations
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema_txn",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Helper to assert transaction table is empty
		const expectTxnEmpty = async () => {
			const rows = await db
				.selectFrom("lix_internal_transaction_state")
				.selectAll()
				.execute();
			expectDeterministic(rows.length).toBe(0);
		};

		// 1) SELECT should not stage anything
		await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema_txn")
			.orderBy("entity_id")
			.selectAll()
			.execute();
		await expectTxnEmpty();

		// 2) INSERT tracked via lix_internal_state_vtable
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "e_txn",
				file_id: "f_txn",
				schema_key: "mock_schema_txn",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({ value: "v1" }),
				untracked: 0, // tracked
			})
			.execute();
		await expectTxnEmpty();

		// 3) UPDATE via lix_internal_state_vtable
		await db
			.updateTable("lix_internal_state_vtable")
			.set({ snapshot_content: JSON.stringify({ value: "v2" }) })
			.where("entity_id", "=", "e_txn")
			.where("schema_key", "=", "mock_schema_txn")
			.where("file_id", "=", "f_txn")
			.execute();
		await expectTxnEmpty();

		// 4) DELETE via lix_internal_state_vtable
		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e_txn")
			.where("schema_key", "=", "mock_schema_txn")
			.where("file_id", "=", "f_txn")
			.execute();
		await expectTxnEmpty();
	}
);

simulationTest(
	"untracked mutations don't trigger change control via lix_internal_state_vtable",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "string",
				},
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Count changes before any untracked mutations
		const changesInitial = await db.selectFrom("change").selectAll().execute();

		// 1. INSERT untracked state via lix_internal_state_vtable
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "untracked-entity",
				file_id: "test-file",
				schema_key: "mock_schema",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({
					value: "untracked value",
				}),
				untracked: 1, // untracked
			})
			.execute();

		// Count changes after untracked insert
		const changesAfterInsert = await db
			.selectFrom("change")
			.selectAll()
			.execute();

		// Number of changes should be identical (no change control for untracked)
		expectDeterministic(changesAfterInsert.length).toBe(changesInitial.length);

		// Verify the untracked entity exists in vtable
		const untrackedState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "untracked-entity")
			.orderBy("entity_id")
			.select([
				"entity_id",
				sql`json(snapshot_content)`.as("snapshot_content"),
				"untracked",
			])
			.execute();

		expectDeterministic(untrackedState).toHaveLength(1);
		expectDeterministic(untrackedState[0]?.snapshot_content).toEqual({
			value: "untracked value",
		});
		expectDeterministic(untrackedState[0]?.untracked).toBe(1);

		// 2. UPDATE untracked state via lix_internal_state_vtable
		await db
			.updateTable("lix_internal_state_vtable")
			.where("entity_id", "=", "untracked-entity")
			.set({
				snapshot_content: JSON.stringify({
					value: "untracked value updated",
				}),
			})
			.execute();

		// Count changes after untracked update
		const changesAfterUpdate = await db
			.selectFrom("change")
			.selectAll()
			.execute();

		// Still no new changes
		expectDeterministic(changesAfterUpdate.length).toBe(changesInitial.length);

		// 3. DELETE untracked state via lix_internal_state_vtable
		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "untracked-entity")
			.execute();

		// Count changes after untracked delete
		const changesAfterDelete = await db
			.selectFrom("change")
			.selectAll()
			.execute();

		// Still no new changes
		expectDeterministic(changesAfterDelete.length).toBe(changesInitial.length);
	}
);

simulationTest(
	"tracked update to previously untracked entity deletes untracked state via lix_internal_state_vtable",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "string",
				},
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert untracked state via lix_internal_state_vtable
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "override-entity",
				file_id: "test-file",
				schema_key: "mock_schema",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({
					value: "untracked value",
				}),
				untracked: 1,
			})
			.execute();

		// Verify untracked state exists
		const untrackedState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "override-entity")
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content"), "untracked"])
			.execute();

		expectDeterministic(untrackedState).toHaveLength(1);
		expectDeterministic(untrackedState[0]?.snapshot_content).toEqual({
			value: "untracked value",
		});

		// Now update the entity as tracked (should delete from untracked table)
		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({
					value: "tracked value",
				}),
				untracked: 0,
			})
			.where("entity_id", "=", "override-entity")
			.where("schema_key", "=", "mock_schema")
			.execute();

		// Verify tracked state has overridden untracked state
		const finalState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "override-entity")
			.orderBy("entity_id")
			.select([sql`json(snapshot_content)`.as("snapshot_content"), "untracked"])
			.execute();

		expectDeterministic(finalState).toHaveLength(1);
		expectDeterministic(finalState[0]?.snapshot_content).toEqual({
			value: "tracked value",
		});

		// Verify a change was created for the tracked mutation
		const changes = await db
			.selectFrom("change")
			.where("entity_id", "=", "override-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expectDeterministic(changes.length).toBeGreaterThan(0);
	}
);

simulationTest(
	"created_at and updated_at timestamps are computed correctly via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: {
					type: "string",
				},
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert initial entity via lix_internal_state_vtable
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
				snapshot_content: JSON.stringify({
					value: "initial value",
				}),
				untracked: 0,
			})
			.execute();

		const stateAfterInsert = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e0")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(stateAfterInsert).toHaveLength(1);
		expect(stateAfterInsert[0]?.created_at).toBeDefined();
		expect(stateAfterInsert[0]?.updated_at).toBeDefined();
		expect(stateAfterInsert[0]?.created_at).toBe(
			stateAfterInsert[0]?.updated_at
		);

		// Update the entity via lix_internal_state_vtable
		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({
					value: "updated value",
				}),
			})
			.where("entity_id", "=", "e0")
			.where("schema_key", "=", "mock_schema")
			.execute();

		const stateAfterUpdate = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e0")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(stateAfterUpdate).toHaveLength(1);
		expect(stateAfterUpdate[0]?.created_at).toBeDefined();
		expect(stateAfterUpdate[0]?.updated_at).toBeDefined();

		// created_at should remain the same
		expect(stateAfterUpdate[0]?.created_at).toBe(
			stateAfterInsert[0]?.created_at
		);

		// updated_at should be different (newer)
		expect(stateAfterUpdate[0]?.updated_at).not.toBe(
			stateAfterInsert[0]?.updated_at
		);
	}
);

simulationTest(
	"untracked insert then delete within same transaction leaves no residue via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "key_value",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				key: { type: "string" },
				value: { type: ["boolean", "null"] },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		const active = await lix.db
			.selectFrom("active_version")
			.selectAll()
			.executeTakeFirstOrThrow();

		await db.transaction().execute(async (trx) => {
			await trx
				.insertInto("lix_internal_state_vtable")
				.values({
					entity_id: "tx_skip_flag_untracked",
					file_id: "system",
					schema_key: "key_value",
					plugin_key: "lix_own_entity",
					schema_version: "1.0",
					version_id: (active as any).version_id ?? (active as any).id,
					snapshot_content: JSON.stringify({
						key: "tx_skip_flag_untracked",
						value: true,
					}),
					untracked: 1, // SQLite uses INTEGER for boolean
				})
				.execute();

			await trx
				.deleteFrom("lix_internal_state_vtable")
				.where("entity_id", "=", "tx_skip_flag_untracked")
				.where(
					"version_id",
					"=",
					(active as any).version_id ?? (active as any).id
				)
				.execute();
		});

		const remaining = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "tx_skip_flag_untracked")
			.where(
				"version_id",
				"=",
				(active as any).version_id ?? (active as any).id
			)
			.where("snapshot_content", "is not", null)
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(remaining).toHaveLength(0);
	}
);

simulationTest(
	"state is separated by version",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await createVersion({ lix, id: "version_a" });
		await createVersion({ lix, id: "version_b" });

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		await db
			.insertInto("lix_internal_state_vtable")
			.values([
				{
					entity_id: "e0",
					file_id: "f0",
					schema_key: "mock_schema",
					plugin_key: "mock_plugin",
					schema_version: "1.0",
					snapshot_content: JSON.stringify({
						value: "hello world from version a",
					}),
					version_id: "version_a",
					untracked: 0,
				},
				{
					entity_id: "e0",
					file_id: "f0",
					schema_key: "mock_schema",
					plugin_key: "mock_plugin",
					schema_version: "1.0",
					snapshot_content: JSON.stringify({
						value: "hello world from version b",
					}),
					version_id: "version_b",
					untracked: 0,
				},
			])
			.execute();

		const stateAfterInserts = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.where("snapshot_content", "is not", null)
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(stateAfterInserts).toHaveLength(2);

		// The vtable returns snapshot_content as string (JSON), we need to parse it
		const content0 = stateAfterInserts[0]!.snapshot_content;
		const content1 = stateAfterInserts[1]!.snapshot_content;

		expect(content0).toEqual({
			value: "hello world from version a",
		});
		expect(content1).toEqual({
			value: "hello world from version b",
		});

		// Verify timestamps are present
		expect(stateAfterInserts[0]?.created_at).toBeDefined();
		expect(stateAfterInserts[0]?.updated_at).toBeDefined();
		expect(stateAfterInserts[1]?.created_at).toBeDefined();
		expect(stateAfterInserts[1]?.updated_at).toBeDefined();

		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({
					value: "hello world from version b UPDATED",
				}),
			})
			.where("entity_id", "=", "e0")
			.where("schema_key", "=", "mock_schema")
			.where("version_id", "=", "version_b")
			.execute();

		const stateAfterUpdate = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.where("snapshot_content", "is not", null)
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(stateAfterUpdate).toHaveLength(2);

		const updateContent0 = stateAfterUpdate[0]!.snapshot_content;
		const updateContent1 = stateAfterUpdate[1]!.snapshot_content;

		expect(updateContent0).toEqual({
			value: "hello world from version a",
		});
		expect(updateContent1).toEqual({
			value: "hello world from version b UPDATED",
		});

		await db
			.deleteFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_b")
			.execute();

		const stateAfterDelete = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.where("snapshot_content", "is not", null)
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(stateAfterDelete).toHaveLength(1);
		expect(stateAfterDelete[0]?.version_id).toBe("version_a");

		const deleteContent = stateAfterDelete[0]!.snapshot_content;

		expect(deleteContent).toEqual({
			value: "hello world from version a",
		});
	}
);

simulationTest(
	"created_at and updated_at are version specific via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await createVersion({ lix, id: "version_a" });
		await createVersion({ lix, id: "version_b" });

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			additionalProperties: false,
			type: "object",
			properties: {
				value: {
					type: "string",
				},
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert entity in version A
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				version_id: "version_a",
				snapshot_content: JSON.stringify({
					value: "value in version a",
				}),
				untracked: 0,
			})
			.execute();

		// Insert same entity in version B
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				version_id: "version_b",
				snapshot_content: JSON.stringify({
					value: "value in version b",
				}),
				untracked: 0,
			})
			.execute();

		const stateVersionA = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_a")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		const stateVersionB = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_b")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(stateVersionA).toHaveLength(1);
		expect(stateVersionB).toHaveLength(1);

		// Both should have timestamps
		expect(stateVersionA[0]?.created_at).toBeDefined();
		expect(stateVersionA[0]?.updated_at).toBeDefined();
		expect(stateVersionB[0]?.created_at).toBeDefined();
		expect(stateVersionB[0]?.updated_at).toBeDefined();

		// the same entity has been inserted but with different changes
		expect(stateVersionA[0]?.created_at).not.toBe(stateVersionB[0]?.created_at);

		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({
					value: "updated value in version b",
				}),
			})
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_b")
			.execute();

		const updatedStateVersionA = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_a")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		const updatedStateVersionB = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_b")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		// Version A should remain unchanged
		expect(updatedStateVersionA[0]?.updated_at).toBe(
			stateVersionA[0]?.updated_at
		);

		// Version B should have updated timestamp
		expect(updatedStateVersionB[0]?.updated_at).not.toBe(
			stateVersionB[0]?.updated_at
		);
	}
);

simulationTest(
	"state appears in both versions when they share the same commit via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const versionA = await createVersion({ lix, id: "version_a" });

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};
		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		// Insert state into version A
		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({
					value: "shared state",
				}),
				version_id: "version_a",
				untracked: 0,
			})
			.execute();

		const versionAAfterInsert = await lix.db
			.selectFrom("version")
			.where("id", "=", versionA.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		const versionB = await createVersionFromCommit({
			lix,
			id: "version_b",
			commit: { id: versionAAfterInsert.commit_id },
		});

		expect(versionB.commit_id).toBe(versionAAfterInsert.commit_id);

		const stateInBothVersions = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		// Both versions should see the same state
		expect(stateInBothVersions).toHaveLength(2);
		expect(stateInBothVersions[0]?.entity_id).toBe("e0");
		expect(stateInBothVersions[1]?.entity_id).toBe("e0");

		const sharedContent0 = stateInBothVersions[0]!.snapshot_content;
		const sharedContent1 = stateInBothVersions[1]!.snapshot_content;

		expect(sharedContent0).toEqual({ value: "shared state" });
		expect(sharedContent1).toEqual({ value: "shared state" });
		expect(stateInBothVersions[0]?.version_id).toBe("version_a");
		expect(stateInBothVersions[1]?.version_id).toBe("version_b");
		expect(stateInBothVersions[0]?.commit_id).toBe(
			versionAAfterInsert.commit_id
		);
		expect(stateInBothVersions[1]?.commit_id).toBe(
			versionAAfterInsert.commit_id
		);
	}
);

simulationTest(
	"state diverges when versions have common ancestor but different changes via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create base version and add initial state
		const baseVersion = await createVersion({ lix, id: "base_version" });

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		await db
			.insertInto("lix_internal_state_vtable")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				schema_version: "1.0",
				snapshot_content: JSON.stringify({
					value: "base state",
				}),
				version_id: "base_version",
				untracked: 0,
			})
			.execute();

		// Create two versions from the same base version
		await createVersion({
			lix,
			id: "version_a",
			from: baseVersion,
		});

		await createVersion({
			lix,
			id: "version_b",
			from: baseVersion,
		});

		const versions = await lix.db
			.selectFrom("version")
			.where("id", "in", ["base_version", "version_a", "version_b"])
			.select(["id", "commit_id"])
			.execute();

		expect(versions).toHaveLength(3);

		// Both versions should initially see the base state
		const initialState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(initialState).toHaveLength(3); // base, version_a, version_b

		// Update state in version A
		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({ value: "updated in version A" }),
			})
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_a")
			.execute();

		// Update state in version B differently
		await db
			.updateTable("lix_internal_state_vtable")
			.set({
				snapshot_content: JSON.stringify({ value: "updated in version B" }),
			})
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_b")
			.execute();

		const divergedState = await db
			.selectFrom("lix_internal_state_vtable")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.selectAll()
			.orderBy("version_id")
			.execute();

		// All three versions should have different states
		expect(divergedState).toHaveLength(3);
		expect(divergedState[0]?.version_id).toBe("base_version");
		expect(divergedState[1]?.version_id).toBe("version_a");
		expect(divergedState[2]?.version_id).toBe("version_b");

		const divergedContent0 = divergedState[0]!.snapshot_content;
		const divergedContent1 = divergedState[1]!.snapshot_content;
		const divergedContent2 = divergedState[2]!.snapshot_content;

		expect(divergedContent0).toEqual({ value: "base state" });
		expect(divergedContent1).toEqual({ value: "updated in version A" });
		expect(divergedContent2).toEqual({ value: "updated in version B" });
	}
);

simulationTest(
	"tracked insert then delete within same transaction leaves no residue via lix_internal_state_vtable",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "key_value",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				key: { type: "string" },
				value: { type: ["boolean", "null"] },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		const active = await lix.db
			.selectFrom("active_version")
			.selectAll()
			.executeTakeFirstOrThrow();

		await db.transaction().execute(async (trx) => {
			// tracked by default (untracked: 0)
			await trx
				.insertInto("lix_internal_state_vtable")
				.values({
					entity_id: "tx_skip_flag_tracked",
					file_id: "system",
					schema_key: "key_value",
					plugin_key: "lix_own_entity",
					schema_version: "1.0",
					version_id: (active as any).version_id ?? (active as any).id,
					snapshot_content: JSON.stringify({
						key: "tx_skip_flag_tracked",
						value: true,
					}),
					untracked: 0, // tracked (SQLite uses INTEGER for boolean)
				})
				.execute();

			await trx
				.deleteFrom("lix_internal_state_vtable")
				.where("entity_id", "=", "tx_skip_flag_tracked")
				.where(
					"version_id",
					"=",
					(active as any).version_id ?? (active as any).id
				)
				.execute();
		});

		const remaining = await db
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", "tx_skip_flag_tracked")
			.where(
				"version_id",
				"=",
				(active as any).version_id ?? (active as any).id
			)
			.where("snapshot_content", "is not", null)
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expect(remaining).toHaveLength(0);
	}
);
