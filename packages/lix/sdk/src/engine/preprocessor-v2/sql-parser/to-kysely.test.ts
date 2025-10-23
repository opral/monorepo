import { test, expect } from "vitest";
import { Kysely } from "kysely";
import { createLixDialect } from "../../../database/sqlite/lix-dialect.js";
import { toKysely } from "./to-kysely.js";
import { parse } from "./parser.js";
import { compile } from "../compile.js";

const kysely = new Kysely<any>({
	dialect: createLixDialect({
		sqlite: {} as any,
	}),
});

test("SELECT matches kysely", () => {
	const sql = `SELECT * FROM table;`;

	const expectedNode = kysely.selectFrom("table").selectAll().toOperationNode();
	const node = toKysely(parse(sql));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("handles quoted table names", () => {
	const sql = `SELECT * FROM "lix_internal_state_vtable"`;

	const expectedNode = kysely
		.selectFrom("lix_internal_state_vtable")
		.selectAll()
		.toOperationNode();
	const node = toKysely(parse(sql));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports table aliases with AS", () => {
	const sql = `SELECT * FROM projects AS p`;

	const expectedNode = kysely
		.selectFrom("projects as p")
		.selectAll()
		.toOperationNode();
	const node = toKysely(parse(sql));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports table aliases without AS", () => {
	const sql = `SELECT * FROM state_all s`;

	const expectedNode = kysely
		.selectFrom("state_all as s")
		.selectAll()
		.toOperationNode();
	const node = toKysely(parse(sql));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports where clauses with string literals", () => {
	const sql = `SELECT * FROM state_all s WHERE s.schema_key = 'test_schema'`;

	const expectedNode = kysely
		.selectFrom("state_all as s")
		.selectAll()
		.where("s.schema_key", "=", "test_schema")
		.toOperationNode();
	const node = toKysely(parse(sql));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports table aliases with AS", () => {
	const sql = `SELECT * FROM projects AS p`;

	const expectedNode = kysely
		.selectFrom("projects as p")
		.selectAll()
		.toOperationNode();
	const node = toKysely(parse(sql));
	const out = compile(node);

	expect(out.sql.toLowerCase()).toBe('select * from "projects" as "p"');
	expect(out.parameters).toEqual([]);
	expect(node).toEqual(expectedNode);
});

test("supports table aliases without AS", () => {
	const sql = `SELECT * FROM state_all s`;

	const expectedNode = kysely
		.selectFrom("state_all as s")
		.selectAll()
		.toOperationNode();
	const node = toKysely(parse(sql));
	const out = compile(node);

	expect(out.sql.toLowerCase()).toBe('select * from "state_all" as "s"');
	expect(out.parameters).toEqual([]);
	expect(node).toEqual(expectedNode);
});
