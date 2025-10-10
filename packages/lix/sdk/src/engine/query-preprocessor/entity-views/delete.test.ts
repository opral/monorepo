import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";

test("rewrites deletes for stored schema views", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
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

	const preprocess = await createQueryPreprocessor(lix.engine!);
	const table = schema["x-lix-key"];

	const insertResult = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["row-1", "Original"],
	});

	lix.engine!.sqlite.exec({
		sql: insertResult.sql,
		bind: insertResult.parameters as any[],
		returnValue: "resultRows",
	});

	const deleteResult = preprocess({
		sql: `DELETE FROM ${table} WHERE id = ?`,
		parameters: ["row-1"],
	});

	expect(deleteResult.sql).toContain("internal_state_vtable_rewritten");
	expect(deleteResult.parameters).toEqual([table, "row-1"]);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters as any[],
	});

	const selectResult = preprocess({
		sql: `SELECT name FROM ${table} WHERE id = ?`,
		parameters: ["row-1"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters as any[],
	}).rows;

	expect(rows).toEqual([]);
});

test("prefixless alias deletes target stored schema key", async () => {
	const lix = await openLix({});
	const preprocess = await createQueryPreprocessor(lix.engine!);

	const insertResult = preprocess({
		sql: "INSERT INTO key_value (key, value) VALUES (?, ?)",
		parameters: ["alias", { foo: "bar" }],
	});

	lix.engine!.sqlite.exec({
		sql: insertResult.sql,
		bind: insertResult.parameters as any[],
		returnValue: "resultRows",
	});

	const deleteResult = preprocess({
		sql: "DELETE FROM key_value WHERE key = ?",
		parameters: ["alias"],
	});

	expect(deleteResult.parameters[0]).toBe("lix_key_value");

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters as any[],
	});

	const selectResult = preprocess({
		sql: "SELECT value FROM key_value WHERE key = ?",
		parameters: ["alias"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters as any[],
	}).rows;

	expect(rows).toEqual([]);
});

test("rewrites deletes for _all views", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
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

	const preprocess = await createQueryPreprocessor(lix.engine!);
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

	lix.engine!.sqlite.exec({
		sql: insertResult.sql,
		bind: insertResult.parameters as any[],
		returnValue: "resultRows",
	});

	const deleteResult = preprocess({
		sql: `DELETE FROM ${allView} WHERE id = ? AND lixcol_version_id = ?`,
		parameters: ["row-2", activeVersion.version_id],
	});

	expect(deleteResult.sql).toContain("internal_state_vtable_rewritten");
	expect(deleteResult.parameters).toEqual([
		table,
		"row-2",
		activeVersion.version_id,
	]);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters as any[],
	});

	const selectResult = preprocess({
		sql: `SELECT name FROM ${allView} WHERE id = ? AND lixcol_version_id = ?`,
		parameters: ["row-2", activeVersion.version_id],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters as any[],
	}).rows;

	expect(rows).toEqual([]);
});

test("skips rewriting for disabled state_all view", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "limited_delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-entity-views": ["state"] as (
			| "state"
			| "state_all"
			| "state_history"
		)[],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = await createQueryPreprocessor(lix.engine!);
	const sql = "DELETE FROM limited_delete_schema_all WHERE id = ?";
	const parameters = ["row-1"];
	const rewritten = preprocess({ sql, parameters });

	expect(rewritten.sql).toBe(sql);
	expect(rewritten.parameters).toEqual(parameters);

	await lix.close();
});

test("base-only views apply metadata version defaults on delete", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
			lixcol_version_id: '"global"',
		},
		"x-lix-entity-views": ["state"] as (
			| "state"
			| "state_all"
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
	const preprocess = await createQueryPreprocessor(lix.engine!);
	const table = schema["x-lix-key"];

	const insertResult = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["base-del-1", "Delete Me"],
	});

	lix.engine!.executeSync({
		sql: insertResult.sql,
		parameters: insertResult.parameters as any[],
	});

	const deleteResult = preprocess({
		sql: `DELETE FROM ${table} WHERE id = ?`,
		parameters: ["base-del-1"],
	});

	expect(deleteResult.sql).toContain("internal_state_vtable_rewritten");
	expect(deleteResult.parameters).toEqual([table, "base-del-1", "global"]);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters as any[],
	});

	const rows = await lix.db
		.selectFrom("state_all")
		.where("schema_key", "=", table)
		.select(["entity_id"] as const)
		.execute();

	expect(rows).toEqual([]);
	await lix.close();
});

test("base view delete uses schema default version when omitted", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "delete_schema",
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
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = await createQueryPreprocessor(lix.engine!);
	const table = schema["x-lix-key"];

	const insertResult = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["acc-default", "Keep me"],
	});

	lix.engine!.sqlite.exec({
		sql: insertResult.sql,
		bind: insertResult.parameters as any[],
		returnValue: "resultRows",
	});

	const deleteResult = preprocess({
		sql: `DELETE FROM ${table} WHERE id = ?`,
		parameters: ["acc-default"],
	});

	expect(deleteResult.sql).toContain("internal_state_vtable_rewritten");
	expect(deleteResult.parameters).toEqual([table, "acc-default", "global"]);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters as any[],
	});

	const rows = await (lix.db as any)
		.selectFrom(table)
		.where("id", "=", "acc-default")
		.selectAll()
		.execute();

	expect(rows).toEqual([]);
});
