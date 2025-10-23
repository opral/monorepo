import { test, expect } from "vitest";
import { Kysely } from "kysely";
import { createEngineDialect } from "../../../database/sqlite/engine-dialect.js";
import { createInMemoryDatabase } from "../../../database/sqlite/create-in-memory-database.js";
import { toKysely } from "./to-kysely.js";
import { parse } from "./parser.js";
import { compile } from "../compile.js";

const kysely = new Kysely<any>({
	dialect: createEngineDialect({
		database: await createInMemoryDatabase({}),
	}),
});

test("SELECT matches kysely", () => {
	const sql = `SELECT * FROM table;`;

	const expectedNode = kysely.selectFrom("table").selectAll().toOperationNode();
	const node = toKysely(parse(sql));
	const out = compile(node);

	expect(out.sql.toLowerCase()).toBe('select * from "table"');
	expect(out.parameters).toEqual([]);
	expect(node).toEqual(expectedNode);
});
