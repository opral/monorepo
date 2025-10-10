import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";

const DELETE_SCHEMA = {
	"x-lix-key": "delete_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-defaults": {
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

test("rewrites deletes for stored schema views", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("stored_schema")
		.values({ value: DELETE_SCHEMA })
		.execute();

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const insertResult = preprocess({
		sql: "INSERT INTO delete_schema (id, name) VALUES (?, ?)",
		parameters: ["row-1", "Original"],
	});

	lix.engine!.sqlite.exec({
		sql: insertResult.sql,
		bind: insertResult.parameters as any[],
		returnValue: "resultRows",
	});

	const deleteResult = preprocess({
		sql: "DELETE FROM delete_schema WHERE id = ?",
		parameters: ["row-1"],
	});

	expect(deleteResult.sql).toContain("DELETE FROM state_all");
	expect(deleteResult.parameters).toEqual(["delete_schema", "row-1"]);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters as any[],
	});

	const selectResult = preprocess({
		sql: "SELECT name FROM delete_schema WHERE id = ?",
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
	await lix.db
		.insertInto("stored_schema")
		.values({ value: DELETE_SCHEMA })
		.execute();

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const insertResult = preprocess({
		sql: "INSERT INTO delete_schema_all (id, name, lixcol_version_id) VALUES (?, ?, ?)",
		parameters: ["row-2", "Original All", activeVersion.version_id],
	});

	lix.engine!.sqlite.exec({
		sql: insertResult.sql,
		bind: insertResult.parameters as any[],
		returnValue: "resultRows",
	});

	const deleteResult = preprocess({
		sql: "DELETE FROM delete_schema_all WHERE id = ? AND lixcol_version_id = ?",
		parameters: ["row-2", activeVersion.version_id],
	});

	expect(deleteResult.sql).toContain("DELETE FROM state_all");
	expect(deleteResult.parameters).toEqual([
		"delete_schema",
		"row-2",
		activeVersion.version_id,
	]);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters as any[],
	});

	const selectResult = preprocess({
		sql: "SELECT name FROM delete_schema_all WHERE id = ? AND lixcol_version_id = ?",
		parameters: ["row-2", activeVersion.version_id],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters as any[],
	}).rows;

	expect(rows).toEqual([]);
});

test("base view delete uses schema default version when omitted", async () => {
	const lix = await openLix({});
	const defaultedSchema = {
		...DELETE_SCHEMA,
		"x-lix-defaults": {
			...DELETE_SCHEMA["x-lix-defaults"],
			lixcol_version_id: '"global"',
		},
	} as const;

	await lix.db
		.insertInto("stored_schema")
		.values({ value: defaultedSchema })
		.execute();

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const insertResult = preprocess({
		sql: "INSERT INTO delete_schema (id, name) VALUES (?, ?)",
		parameters: ["acc-default", "Keep me"],
	});

	lix.engine!.sqlite.exec({
		sql: insertResult.sql,
		bind: insertResult.parameters as any[],
		returnValue: "resultRows",
	});

	const deleteResult = preprocess({
		sql: "DELETE FROM delete_schema WHERE id = ?",
		parameters: ["acc-default"],
	});

	expect(deleteResult.sql).toContain("DELETE FROM state_all");
	expect(deleteResult.parameters).toEqual([
		"delete_schema",
		"acc-default",
		"global",
	]);

	lix.engine!.executeSync({
		sql: deleteResult.sql,
		parameters: deleteResult.parameters as any[],
	});

	const rows = await (lix.db as any)
		.selectFrom("delete_schema")
		.where("id", "=", "acc-default")
		.selectAll()
		.execute();

	expect(rows).toEqual([]);
});
