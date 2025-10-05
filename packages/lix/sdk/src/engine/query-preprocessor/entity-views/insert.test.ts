import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";

const INSERTABLE_SCHEMA = {
	"x-lix-key": "insertable_schema",
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

test("rewrites inserts for stored schema views", async () => {
	const lix = await openLix({});
	try {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: INSERTABLE_SCHEMA })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const rewritten = preprocess({
			sql: "INSERT INTO insertable_schema (id, name) VALUES (?, ?)",
			parameters: ["row-1", "Entity 1"],
		});

		expect(rewritten.sql).toContain("INSERT INTO state_all");
		expect(rewritten.parameters).toEqual([
			"row-1",
			"insertable_schema",
			"lix",
			"lix_own_entity",
			"row-1",
			"Entity 1",
			"1.0",
			null,
			0,
		]);

		lix.engine!.sqlite.exec({
			sql: rewritten.sql,
			bind: rewritten.parameters as any[],
			returnValue: "resultRows",
		});

		const selectResult = preprocess({
			sql: "SELECT name FROM insertable_schema WHERE id = ?",
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
				name: "Entity 1",
			},
		]);
	} finally {
		await lix.close();
	}
});

test("rewrites inserts for _all view", async () => {
	const lix = await openLix({});
	try {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: INSERTABLE_SCHEMA })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		const rewritten = preprocess({
			sql: "INSERT INTO insertable_schema_all (id, name, lixcol_version_id) VALUES (?, ?, ?)",
			parameters: ["row-2", "Entity 2", activeVersion.version_id],
		});

		expect(rewritten.sql).toContain("INSERT INTO state_all");
		expect(rewritten.parameters).toEqual([
			"row-2",
			"insertable_schema",
			"lix",
			activeVersion.version_id,
			"lix_own_entity",
			"row-2",
			"Entity 2",
			"1.0",
			null,
			0,
		]);

		lix.engine!.sqlite.exec({
			sql: rewritten.sql,
			bind: rewritten.parameters as any[],
			returnValue: "resultRows",
		});

		const selectResult = preprocess({
			sql: "SELECT name FROM insertable_schema_all WHERE id = ? AND lixcol_version_id = ?",
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
				name: "Entity 2",
			},
		]);
	} finally {
		await lix.close();
	}
});

test("does not rewrite history view inserts", async () => {
	const lix = await openLix({});
	try {
		await lix.db
			.insertInto("stored_schema")
			.values({ value: INSERTABLE_SCHEMA })
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const originalSql =
			"INSERT INTO insertable_schema_history (id, name) VALUES (?, ?)";
		const rewritten = preprocess({
			sql: originalSql,
			parameters: ["row-3", "Entity 3"],
		});

		expect(rewritten.sql).toBe(originalSql);
		expect(rewritten.parameters).toEqual(["row-3", "Entity 3"]);
	} finally {
		await lix.close();
	}
});
