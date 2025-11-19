import { expect, test } from "vitest";
import { Kysely, sql } from "kysely";
import { openLix } from "../../../lix/open-lix.js";
import type { LixInternalDatabaseSchema } from "../../../database/schema.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";

test("state_by_version supports insert on conflict do update", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const schema: LixSchemaDefinition = {
		"x-lix-key": "sbv_on_conflict",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
		properties: { value: { type: "string" } },
	};

	await db.insertInto("stored_schema").values({ value: schema }).execute();

	const activeVersion = await db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	await db
		.insertInto("state_by_version")
		.values({
			entity_id: "sbv-upsert",
			schema_key: "sbv_on_conflict",
			file_id: "sbv-file",
			version_id: activeVersion.version_id,
			plugin_key: "plugin-a",
			snapshot_content: { value: "initial" },
			schema_version: "1.0",
			metadata: null,
		})
		.execute();

	const changesBefore = await db
		.selectFrom("change")
		.where("entity_id", "=", "sbv-upsert")
		.where("schema_key", "=", "sbv_on_conflict")
		.where("file_id", "=", "sbv-file")
		.selectAll()
		.execute();

	await db
		.insertInto("state_by_version")
		.values({
			entity_id: "sbv-upsert",
			schema_key: "sbv_on_conflict",
			file_id: "sbv-file",
			version_id: sql`(SELECT version_id FROM active_version)`,
			plugin_key: "plugin-b",
			snapshot_content: { value: "updated" },
			schema_version: "1.0",
			metadata: null,
		})
		.onConflict((oc) =>
			oc
				.columns(["entity_id", "schema_key", "file_id", "version_id"])
				.doUpdateSet((eb) => ({
					snapshot_content: eb.ref("excluded.snapshot_content"),
					plugin_key: eb.ref("excluded.plugin_key"),
					schema_version: eb.ref("excluded.schema_version"),
					untracked: eb.ref("excluded.untracked"),
				}))
		)
		.execute();

	const row = await db
		.selectFrom("state_by_version")
		.where("entity_id", "=", "sbv-upsert")
		.where("schema_key", "=", "sbv_on_conflict")
		.where("file_id", "=", "sbv-file")
		.orderBy("version_id")
		.select([
			sql`json(snapshot_content)`.as("snapshot_content"),
			"plugin_key",
			"untracked",
		])
		.executeTakeFirstOrThrow();

	const changesAfter = await db
		.selectFrom("change")
		.where("entity_id", "=", "sbv-upsert")
		.where("schema_key", "=", "sbv_on_conflict")
		.where("file_id", "=", "sbv-file")
		.selectAll()
		.execute();

	expect(row.snapshot_content).toEqual({ value: "updated" });
	expect(row.plugin_key).toBe("plugin-b");
	expect(row.untracked).toBe(0);
	expect(changesAfter.length).toBe(changesBefore.length + 1);

	await lix.close();
});
