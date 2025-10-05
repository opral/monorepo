import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";

const UPDATE_SCHEMA = {
	"x-lix-key": "update_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
	},
	required: ["id"],
	additionalProperties: false,
} as const;

test("rewrites updates for stored schema views", async () => {
	const lix = await openLix({});
	try {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: UPDATE_SCHEMA })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const insertResult = preprocess({
			sql: "INSERT INTO update_schema (id, name) VALUES (?, ?)",
			parameters: ["row-1", "Original"],
		});

		lix.engine!.sqlite.exec({
			sql: insertResult.sql,
			bind: insertResult.parameters as any[],
			returnValue: "resultRows",
		});

		const updateResult = preprocess({
			sql: "UPDATE update_schema SET name = ? WHERE id = ?",
			parameters: ["Updated", "row-1"],
		});

		expect(updateResult.sql).toContain("UPDATE state_all");
		expect(updateResult.sql).toContain(
			"json_extract(snapshot_content, '$.id') = ?"
		);
		expect(updateResult.parameters).toEqual([
			"update_schema",
			"lix_own_entity",
			"Updated",
			"1.0",
			"row-1",
			"update_schema",
		]);

		lix.engine!.sqlite.exec({
			sql: updateResult.sql,
			bind: updateResult.parameters as any[],
			returnValue: "resultRows",
		});

		const selectResult = preprocess({
			sql: "SELECT name FROM update_schema WHERE id = ?",
			parameters: ["row-1"],
		});

		const rows = lix.engine!.sqlite.exec({
			sql: selectResult.sql,
			bind: selectResult.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(rows).toEqual([
			{
				name: "Updated",
			},
		]);
	} finally {
		await lix.close();
	}
});

test("rewrites updates for _all views", async () => {
	const lix = await openLix({});
	try {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: UPDATE_SCHEMA })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		const insertResult = preprocess({
			sql: "INSERT INTO update_schema_all (id, name, lixcol_version_id) VALUES (?, ?, ?)",
			parameters: ["row-2", "Original All", activeVersion.version_id],
		});

		lix.engine!.sqlite.exec({
			sql: insertResult.sql,
			bind: insertResult.parameters as any[],
			returnValue: "resultRows",
		});

		const updateResult = preprocess({
			sql: "UPDATE update_schema_all SET name = ? WHERE id = ? AND lixcol_version_id = ?",
			parameters: ["Updated All", "row-2", activeVersion.version_id],
		});

		expect(updateResult.sql).toContain("UPDATE state_all");
		expect(updateResult.parameters).toEqual([
			"update_schema",
			"lix_own_entity",
			"Updated All",
			"1.0",
			"row-2",
			activeVersion.version_id,
			"update_schema",
		]);

		lix.engine!.sqlite.exec({
			sql: updateResult.sql,
			bind: updateResult.parameters as any[],
			returnValue: "resultRows",
		});

		const selectResult = preprocess({
			sql: "SELECT name FROM update_schema_all WHERE id = ? AND lixcol_version_id = ?",
			parameters: ["row-2", activeVersion.version_id],
		});

		const rows = lix.engine!.sqlite.exec({
			sql: selectResult.sql,
			bind: selectResult.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(rows).toEqual([
			{
				name: "Updated All",
			},
		]);
	} finally {
		await lix.close();
	}
});

test("rewrites updates with JSON payloads", async () => {
	const lix = await openLix({});
	try {
		const schema = {
			"x-lix-key": "json_update_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["id"],
			"x-lix-defaults": {
				lixcol_file_id: "lix",
				lixcol_plugin_key: "lix_own_entity",
			},
			type: "object",
			properties: {
				id: { type: "string" },
				payload: { type: "object" },
			},
			required: ["id", "payload"],
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const insertResult = preprocess({
			sql: "INSERT INTO json_update_schema (id, payload) VALUES (?, ?)",
			parameters: ["row-1", { foo: "bar" }],
		});

		lix.engine!.sqlite.exec({
			sql: insertResult.sql,
			bind: insertResult.parameters as any[],
			returnValue: "resultRows",
		});

		const updateResult = preprocess({
			sql: "UPDATE json_update_schema SET payload = ? WHERE id = ?",
			parameters: [{ items: ["foo", "bar"] }, "row-1"],
		});

		expect(updateResult.parameters).toContain('{"items":["foo","bar"]}');

		lix.engine!.sqlite.exec({
			sql: updateResult.sql,
			bind: updateResult.parameters as any[],
			returnValue: "resultRows",
		});

		const selectResult = preprocess({
			sql: "SELECT payload FROM json_update_schema_all WHERE id = ?",
			parameters: ["row-1"],
		});

		const rows = lix.engine!.sqlite.exec({
			sql: selectResult.sql,
			bind: selectResult.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(rows).toEqual([
			{ payload: '{"items":["foo","bar"]}' },
		]);

		const stateRows = await lix.db
			.selectFrom("state_all")
			.select(["snapshot_content"] as const)
			.where("schema_key", "=", "json_update_schema")
			.execute();

		expect(stateRows.map((row) => row.snapshot_content)).toEqual([
			{ id: "row-1", payload: { items: ["foo", "bar"] } },
		]);
	} finally {
		await lix.close();
	}
});
