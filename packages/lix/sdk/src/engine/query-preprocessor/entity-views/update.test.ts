import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";

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

	const preprocess = createQueryPreprocessor(lix.engine!);
	const table = schema["x-lix-key"];

	const insertResult = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["row-1", "Original"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
	});

	const updateResult = preprocess({
		sql: `UPDATE ${table} SET name = ? WHERE id = ?`,
		parameters: ["Updated", "row-1"],
	});

	expect(updateResult.sql).toContain("UPDATE state_by_version");
	expect(updateResult.sql).toContain(
		"json_extract(snapshot_content, '$.id') = ?"
	);
	expect(updateResult.parameters).toEqual(["Updated", "row-1"]);

	const execResult = lix.engine!.executeSync({
		sql: updateResult.sql,
		parameters: updateResult.parameters,
	});
	// eslint-disable-next-line no-console
	const selectResult = preprocess({
		sql: `SELECT name FROM ${table} WHERE id = ?`,
		parameters: ["row-1"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
	}).rows;

	expect(rows).toEqual([
		{
			name: "Updated",
		},
	]);
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

	const preprocess = createQueryPreprocessor(lix.engine!);

	const insertResult = preprocess({
		sql: "INSERT INTO version_override_schema (id, name) VALUES (?, ?)",
		parameters: ["v-1", "Original"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
	});

	const updateResult = preprocess({
		sql: "UPDATE version_override_schema SET name = ? WHERE id = ?",
		parameters: ["Updated", "v-1"],
	});
	expect(updateResult.sql).toContain("UPDATE state_by_version");
	expect(updateResult.sql).toContain("'global'");
	expect(updateResult.parameters).toEqual(["Updated", "v-1"]);

	lix.engine!.executeSync({
		sql: updateResult.sql,
		parameters: updateResult.parameters,
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
});

test("prefixless alias updates target stored schema key", async () => {
	const lix = await openLix({});
	const preprocess = createQueryPreprocessor(lix.engine!);

	const insertResult = preprocess({
		sql: "INSERT INTO key_value (key, value) VALUES (?, ?)",
		parameters: ["alias", JSON.stringify({ foo: "bar" })],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters as any[],
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
		parameters: updateResult.parameters as any[],
	});

	const selectResult = preprocess({
		sql: "SELECT value FROM key_value WHERE key = ?",
		parameters: ["alias"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters as any[],
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

	const preprocess = createQueryPreprocessor(lix.engine!);

	const insertResult = preprocess({
		sql: "INSERT INTO immutable_update_schema (id, name) VALUES (?, ?)",
		parameters: ["row-1", "first"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters as any[],
	});

	const updateResult = preprocess({
		sql: "UPDATE immutable_update_schema SET name = ? WHERE id = ?",
		parameters: ["updated", "row-1"],
	});

	expect(() =>
		lix.engine!.executeSync({
			sql: updateResult.sql,
			parameters: updateResult.parameters as any[],
		})
	).toThrow(/immutable/i);
});

test("active_version updates keep global routing version", async () => {
	const lix = await openLix({});

	const preprocess = createQueryPreprocessor(lix.engine!);

	const before = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const versions = await lix.db.selectFrom("version").select("id").execute();

	const targetVersionId =
		versions.find((row) => row.id !== before.version_id)?.id ??
		before.version_id;

	expect(targetVersionId).not.toBe(before.version_id);

	const updateResult = preprocess({
		sql: "UPDATE active_version SET version_id = ?",
		parameters: [targetVersionId],
	});

	lix.engine!.executeSync({
		sql: updateResult.sql,
		parameters: updateResult.parameters,
	});

	const after = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(after.version_id).not.toBe(before.version_id);
	expect(after.version_id).toBe(targetVersionId);
});

test("base-only views reuse metadata version defaults on update", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "update_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
			lixcol_version_id: '"global"',
		},
		"x-lix-entity-views": ["state"] as (
			| "state"
			| "state_by_version"
			| "state_history"
		)[],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();
	const preprocess = createQueryPreprocessor(lix.engine!);
	const table = schema["x-lix-key"];

	const insert = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["base-up-1", "Original"],
	});
	lix.engine!.executeSync({
		sql: insert.sql,
		parameters: insert.parameters as any[],
	});

	const update = preprocess({
		sql: `UPDATE ${table} SET name = ? WHERE id = ?`,
		parameters: ["Updated", "base-up-1"],
	});

	expect(update.sql).toContain("UPDATE state_by_version");

	lix.engine!.executeSync({
		sql: update.sql,
		parameters: update.parameters as any[],
	});

	const row = await lix.db
		.selectFrom("state_by_version")
		.select(["entity_id", "version_id", "snapshot_content"] as const)
		.where("schema_key", "=", table)
		.where("entity_id", "=", "base-up-1")
		.executeTakeFirstOrThrow();

	expect(typeof row.version_id).toBe("string");
	expect(row.entity_id).toBe("base-up-1");
	expect(row.snapshot_content).toEqual({ id: "base-up-1", name: "Updated" });
	await lix.close();
});

test("rewrites updates for _all views", async () => {
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
	} as const;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);
	const table = schema["x-lix-key"];
	const allView = `${table}_all`;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const insertResult = preprocess({
		sql: `INSERT INTO ${allView} (id, name, lixcol_version_id) VALUES (?, ?, ?)`,
		parameters: ["row-2", "Original All", activeVersion.version_id],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
	});

	const updateResult = preprocess({
		sql: `UPDATE ${allView} SET name = ? WHERE id = ? AND lixcol_version_id = ?`,
		parameters: ["Updated All", "row-2", activeVersion.version_id],
	});

	expect(updateResult.sql).toContain("UPDATE state_by_version");
	expect(updateResult.parameters).toEqual([
		"Updated All",
		"row-2",
		activeVersion.version_id,
	]);

	lix.engine!.executeSync({
		sql: updateResult.sql,
		parameters: updateResult.parameters,
	});

	const selectResult = preprocess({
		sql: `SELECT name FROM ${allView} WHERE id = ? AND lixcol_version_id = ?`,
		parameters: ["row-2", activeVersion.version_id],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
	}).rows;

	expect(rows).toEqual([
		{
			name: "Updated All",
		},
	]);
});

test("rewrites updates with JSON payloads", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "json_update_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			payload: { type: "object" },
		},
		required: ["id", "payload"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);

	const insertResult = preprocess({
		sql: "INSERT INTO json_update_schema (id, payload) VALUES (?, ?)",
		parameters: ["row-1", JSON.stringify({ foo: "bar" })],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
	});

	const updateResult = preprocess({
		sql: "UPDATE json_update_schema SET payload = ? WHERE id = ?",
		parameters: [JSON.stringify({ items: ["foo", "bar"] }), "row-1"],
	});

	expect(updateResult.parameters).toContain('{"items":["foo","bar"]}');

	lix.engine!.executeSync({
		sql: updateResult.sql,
		parameters: updateResult.parameters,
	});

	const selectResult = preprocess({
		sql: "SELECT payload FROM json_update_schema_all WHERE id = ?",
		parameters: ["row-1"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
	}).rows;

	expect(rows).toEqual([{ payload: '{"items":["foo","bar"]}' }]);

	const stateRows = await lix.db
		.selectFrom("state_by_version")
		.select(["snapshot_content"] as const)
		.where("schema_key", "=", "json_update_schema")
		.execute();

	expect(stateRows.map((row) => row.snapshot_content)).toEqual([
		{ id: "row-1", payload: { items: ["foo", "bar"] } },
	]);
});

test("rewrites updates that use SQL expressions referencing entity properties", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "expression_update_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			value: { type: "object" },
		},
		required: ["id", "value"],
		additionalProperties: false,
	} as const;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);

	const insertResult = preprocess({
		sql: "INSERT INTO expression_update_schema (id, value) VALUES (?, ?)",
		parameters: ["row-1", JSON.stringify({ theme: "light", counter: 1 })],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters,
	});

	const updateResult = preprocess({
		sql: "UPDATE expression_update_schema SET value = json_set(value, '$.counter', json_extract(value, '$.counter') + 1, '$.theme', ?) WHERE id = ?",
		parameters: ["dark", "row-1"],
	});

	expect(updateResult.sql).toContain("json_set");
	expect(updateResult.sql).toContain(
		"json_extract(snapshot_content, '$.value')"
	);

	lix.engine!.executeSync({
		sql: updateResult.sql,
		parameters: updateResult.parameters,
	});

	const selectResult = preprocess({
		sql: "SELECT value FROM expression_update_schema WHERE id = ?",
		parameters: ["row-1"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
	}).rows as Array<{ value: string }>;

	const parsed = rows?.[0]?.value ? JSON.parse(rows[0].value) : null;
	expect(parsed).toEqual({ counter: 2, theme: "dark" });

	const stateRows = await lix.db
		.selectFrom("state_by_version")
		.select(["snapshot_content"] as const)
		.where("schema_key", "=", "expression_update_schema")
		.execute();

	expect(stateRows).toEqual([
		{
			snapshot_content: {
				id: "row-1",
				value: { counter: 2, theme: "dark" },
			},
		},
	]);
});

test("skips rewriting for disabled state_by_version view", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "limited_update_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-entity-views": ["state"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);
	const sql = "UPDATE limited_update_schema_all SET name = ? WHERE id = ?";
	const parameters = ["Disabled", "row-1"];
	const rewritten = preprocess({ sql, parameters });

	expect(rewritten.sql).toBe(sql);
	expect(rewritten.parameters).toEqual(parameters);
});
