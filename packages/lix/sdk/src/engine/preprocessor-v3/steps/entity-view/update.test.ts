import { expect, test } from "vitest";
import { openLix } from "../../../../lix/open-lix.js";
import { createPreprocessor } from "../../create-preprocessor.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";

test("rewrites updates for stored schema views", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "update_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const table = schema["x-lix-key"];

	const insertResult = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["row-1", "Original"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const updateResult = preprocess({
		sql: `UPDATE ${table} SET name = ? WHERE id = ?`,
		parameters: ["Updated", "row-1"],
	});

	expect(updateResult.sql).toContain("UPDATE state_by_version");
	expect(updateResult.sql).toContain(
		"json_extract(state_by_version.snapshot_content, '$.id') = ?"
	);
	expect(updateResult.parameters).toEqual(["Updated", "row-1"]);

	lix.engine!.executeSync({
		sql: updateResult.sql,
		parameters: updateResult.parameters,
		preprocessMode: "none",
	});

	const selectResult = preprocess({
		sql: `SELECT name FROM ${table} WHERE id = ?`,
		parameters: ["row-1"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
		preprocessMode: "none",
	}).rows;

	expect(rows).toEqual([
		{
			name: "Updated",
		},
	]);
	await lix.close();
});

test("base view updates honour lixcol_version_id overrides", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "version_override_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
			lixcol_version_id: '"global"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });

	const insertResult = preprocess({
		sql: "INSERT INTO version_override_schema (id, name) VALUES (?, ?)",
		parameters: ["v-1", "Original"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const updateResult = preprocess({
		sql: "UPDATE version_override_schema SET name = ? WHERE id = ?",
		parameters: ["Updated", "v-1"],
	});
	const sql = updateResult.sql;
	expect(sql).toContain("UPDATE state_by_version");
	expect(sql).toContain("'global'");
	expect(updateResult.parameters).toEqual(["Updated", "v-1"]);

	lix.engine!.executeSync({
		sql,
		parameters: updateResult.parameters,
		preprocessMode: "none",
	});

	const stored = await lix.db
		.selectFrom("state_by_version")
		.where("schema_key", "=", "version_override_schema")
		.where("entity_id", "=", "v-1")
		.where("version_id", "=", "global")
		.select(["version_id", "snapshot_content"])
		.executeTakeFirstOrThrow();

	expect(stored.version_id).toBe("global");
	expect(stored.snapshot_content?.name).toBe("Updated");
	await lix.close();
});

test("prefixless alias updates target stored schema key", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const insertResult = preprocess({
		sql: "INSERT INTO key_value (key, value) VALUES (?, ?)",
		parameters: ["alias", JSON.stringify({ foo: "bar" })],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const updateResult = preprocess({
		sql: "UPDATE key_value SET value = json_set(value, '$.foo', ?) WHERE key = ?",
		parameters: ["baz", "alias"],
	});

	expect(updateResult.sql).toContain("UPDATE state_by_version");
	expect(updateResult.sql).toContain("lix_key_value");
	expect(updateResult.parameters).toEqual(["baz", "alias"]);

	lix.engine!.executeSync({
		sql: updateResult.sql,
		parameters: updateResult.parameters,
		preprocessMode: "none",
	});

	const selectResult = preprocess({
		sql: "SELECT value FROM key_value WHERE key = ?",
		parameters: ["alias"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
		preprocessMode: "none",
	}).rows;

	expect(rows).toHaveLength(1);
	const parsed = (() => {
		const raw = rows[0]?.value;
		if (typeof raw === "string") {
			return JSON.parse(raw);
		}
		return raw;
	})();
	expect(parsed).toEqual({ foo: "baz" });
	await lix.close();
});

test("updates to immutable schemas are rejected", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "immutable_update_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		"x-lix-immutable": true,
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });

	const insertResult = preprocess({
		sql: "INSERT INTO immutable_update_schema (id, name) VALUES (?, ?)",
		parameters: ["imm-1", "Original"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const attemptUpdate = () =>
		preprocess({
			sql: "UPDATE immutable_update_schema SET name = ? WHERE id = ?",
			parameters: ["Updated", "imm-1"],
		});

	expect(attemptUpdate).toThrow(/immutable/i);
	await lix.close();
});

test("base-only views reuse metadata version defaults on update", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "base_metadata_update",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
			lixcol_version_id: '"global"',
		},
		"x-lix-entity-views": ["state"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();
	const preprocess = createPreprocessor({ engine: lix.engine! });
	const table = schema["x-lix-key"];

	const insertResult = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["meta-1", "Original"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
		preprocessMode: "none",
	});

	const updateResult = preprocess({
		sql: `UPDATE ${table} SET name = ? WHERE id = ?`,
		parameters: ["Changed", "meta-1"],
	});

	expect(updateResult.sql).toContain("UPDATE state_by_version");
	expect(updateResult.sql).toContain("'global'");

	lix.engine!.executeSync({
		sql: updateResult.sql,
		parameters: updateResult.parameters,
		preprocessMode: "none",
	});

	const stored = await lix.db
		.selectFrom("state_by_version")
		.where("schema_key", "=", "base_metadata_update")
		.where("entity_id", "=", "meta-1")
		.where("version_id", "=", "global")
		.select(["version_id"] as const)
		.executeTakeFirstOrThrow();

	expect(stored.version_id).toBe("global");
	await lix.close();
});
