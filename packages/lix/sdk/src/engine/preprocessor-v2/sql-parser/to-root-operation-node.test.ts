import { test, expect } from "vitest";
import { Kysely, sql } from "kysely";
import { createLixDialect } from "../../../database/sqlite/lix-dialect.js";
import { toRootOperationNode } from "./to-root-operation-node.js";
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
	const node = toRootOperationNode(parse(sql));
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
	const node = toRootOperationNode(parse(sql));
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
	const node = toRootOperationNode(parse(sql));
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
	const node = toRootOperationNode(parse(sql));
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
	const node = toRootOperationNode(parse(sql));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports parameter placeholders in where clauses", () => {
	const query = `SELECT v.* FROM lix_internal_state_vtable AS v WHERE v.schema_key = ?`;

	const expectedNode = kysely
		.selectFrom("lix_internal_state_vtable as v")
		.selectAll("v")
		.where("v.schema_key", "=", sql.raw("?") as any)
		.toOperationNode();
	const node = toRootOperationNode(parse(query));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports explicit column projections", () => {
	const query = `SELECT v.schema_key, v.file_id FROM lix_internal_state_vtable AS v`;

	const expectedNode = kysely
		.selectFrom("lix_internal_state_vtable as v")
		.select(["v.schema_key", "v.file_id"])
		.toOperationNode();
	const node = toRootOperationNode(parse(query));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports OR conditions in where clauses", () => {
	const query = `
		SELECT v.*
		FROM lix_internal_state_vtable AS v
		WHERE (
			v.schema_key = 'test_schema_key'
			OR v.schema_key = 'test_schema_key_other'
		)
	`;

	const expectedNode = kysely
		.selectFrom("lix_internal_state_vtable as v")
		.selectAll("v")
		.where((eb) =>
			eb.or([
				eb("v.schema_key", "=", "test_schema_key"),
				eb("v.schema_key", "=", "test_schema_key_other"),
			])
		)
		.toOperationNode();
	const node = toRootOperationNode(parse(query));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports AND conditions in where clauses", () => {
	const query = `
		SELECT v.*
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = 'test_schema_key' AND v.file_id = 'file_id'
	`;

	const expectedNode = kysely
		.selectFrom("lix_internal_state_vtable as v")
		.selectAll("v")
		.where((eb) =>
			eb.and([
				eb("v.schema_key", "=", "test_schema_key"),
				eb("v.file_id", "=", "file_id"),
			])
		)
		.toOperationNode();
	const node = toRootOperationNode(parse(query));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	const normalize = (sql: string) => sql.replace(/[()]/g, "");
	expect(normalize(out.sql)).toBe(normalize(expectedOut.sql));
	expect(out.parameters).toEqual(expectedOut.parameters);
	const whereNode = (node as any).where?.where;
	expect(whereNode?.kind).toBe("AndNode");
	expect(whereNode?.left?.kind).toBe("BinaryOperationNode");
	expect(whereNode?.right?.kind).toBe("BinaryOperationNode");
});

test("supports inner joins", () => {
	const query = `
		SELECT a.schema_key, a.file_id, b.writer_key
		FROM lix_internal_state_vtable AS a
		INNER JOIN lix_internal_state_vtable AS b
			ON a.schema_key = b.schema_key
	`;

	const expectedNode = kysely
		.selectFrom("lix_internal_state_vtable as a")
		.innerJoin("lix_internal_state_vtable as b", (join) =>
			join.onRef("a.schema_key", "=", "b.schema_key")
		)
		.select(["a.schema_key", "a.file_id", "b.writer_key"])
		.toOperationNode();
	const node = toRootOperationNode(parse(query));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports left joins", () => {
	const query = `
		SELECT a.schema_key, b.writer_key
		FROM lix_internal_state_vtable AS a
		LEFT JOIN lix_internal_state_vtable AS b
			ON a.schema_key = b.schema_key
	`;

	const expectedNode = kysely
		.selectFrom("lix_internal_state_vtable as a")
		.leftJoin("lix_internal_state_vtable as b", (join) =>
			 join.onRef("a.schema_key", "=", "b.schema_key")
		)
		.select(["a.schema_key", "b.writer_key"])
		.toOperationNode();
	const node = toRootOperationNode(parse(query));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports order by clauses", () => {
	const query = `
		SELECT v.schema_key, v.file_id
		FROM lix_internal_state_vtable AS v
		ORDER BY v.schema_key ASC, v.file_id DESC
	`;

	const expectedNode = kysely
		.selectFrom("lix_internal_state_vtable as v")
		.select(["v.schema_key", "v.file_id"])
		.orderBy("v.schema_key", "asc")
		.orderBy("v.file_id", "desc")
		.toOperationNode();
	const node = toRootOperationNode(parse(query));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});

test("supports selecting tables via alias wildcards", () => {
	const sql = `SELECT v.* FROM state_all AS v`;

	const expectedNode = kysely
		.selectFrom("state_all as v")
		.selectAll("v")
		.toOperationNode();
	const node = toRootOperationNode(parse(sql));
	const out = compile(node);
	const expectedOut = compile(expectedNode);

	expect(out.sql).toBe(expectedOut.sql);
	expect(out.parameters).toEqual(expectedOut.parameters);
	expect(node).toEqual(expectedNode);
});
