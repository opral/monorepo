import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createPreprocessor } from "../create-preprocessor.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";

test("rewrites updates for stored schema views", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "update_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_sdk"',
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
	expect(updateResult.sql).toContain("state_by_version.entity_id");
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

test("entity_id predicate is pushed down when rewriting entity view updates", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "pk_push_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_sdk"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			value: { type: "string" },
		},
		required: ["id", "value"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const rewrite = preprocess({
		sql: "UPDATE pk_push_schema SET value = ? WHERE id = ?",
		parameters: ["next", "row-7"],
	});

	const normalizedSql = rewrite.sql.replace(/\s+/g, " ");
	expect(normalizedSql).toContain("state_by_version.entity_id = ?2");
	expect(rewrite.parameters).toEqual(["next", "row-7"]);

	await lix.close();
});

test("rewrites quoted updates for stored schema views", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "inlang_variant",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/messageId"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_sdk"',
		},
		type: "object",
		properties: {
			messageId: { type: "string" },
			pattern: { type: "array" },
		},
		required: ["messageId", "pattern"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const messageId = "019a550d-37c7-728f-9e76-e8f5c08b4444";
	const updatedPattern = JSON.stringify([{ type: "text", value: "Hi" }]);
	const updateResult = preprocess({
		sql: 'UPDATE "inlang_variant" SET "pattern" = ? WHERE "messageId" = ?',
		parameters: [updatedPattern, messageId],
	});

	expect(updateResult.sql).toContain("UPDATE state_by_version");
	expect(updateResult.sql).toContain("'pattern', ?");
	expect(updateResult.sql).toContain("$.messageId");
	expect(updateResult.parameters).toEqual([updatedPattern, messageId]);
	expect(updateResult.sql).not.toBe(
		'UPDATE "inlang_variant" SET "pattern" = ? WHERE "messageId" = ?'
	);
	await lix.close();
});

test("rewrites updates even when predicate omits primary key", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "inlang_variant",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"inlang"',
			lixcol_plugin_key: '"inlang_sdk"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			messageId: { type: "string" },
			pattern: { anyOf: [{ type: "array" }, { type: "object" }], default: [] },
		},
		required: ["id", "messageId", "pattern"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createPreprocessor({ engine: lix.engine! });
	const messageId = "019a550d-37c7-728f-9e76-e8f5c08b4444";
	const updatePattern = JSON.stringify([{ type: "text", value: "Hi" }]);
	const updateResult = preprocess({
		sql: 'UPDATE "inlang_variant" SET "pattern" = ? WHERE "messageId" = ?',
		parameters: [updatePattern, messageId],
	});

	expect(updateResult.sql).toContain("UPDATE state_by_version");
	expect(updateResult.sql).toContain(
		"json_extract(state_by_version.snapshot_content, '$.messageId') = ?"
	);
	expect(updateResult.parameters).toEqual([updatePattern, messageId]);
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
			lixcol_plugin_key: '"lix_sdk"',
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

test("json_set boolean literals remain booleans after rewrite", async () => {
	const lix = await openLix({});
	const preprocess = createPreprocessor({ engine: lix.engine! });

	const updateResult = preprocess({
		sql: "UPDATE key_value SET value = json_set(value, '$.enabled', false, '$.settings.notifications', false) WHERE key = ?",
		parameters: ["toggle"],
	});

	expect(updateResult.sql).not.toContain("$.false");
	expect(updateResult.sql).toContain("FALSE");

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
			lixcol_plugin_key: '"lix_sdk"',
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
			lixcol_plugin_key: '"lix_sdk"',
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
