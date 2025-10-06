import { describe, expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { tokenize } from "../../sql-parser/tokenizer.js";
import { maybeRewriteInsteadOfTrigger } from "./rewrite.js";

describe("INSTEAD OF trigger integration", () => {
	test("version insert routes through registered handler", async () => {
		const lix = await openLix({});
		try {
			const sql = "INSERT INTO version (name) VALUES ('demo')";
			const tokens = tokenize(sql);

	const result = maybeRewriteInsteadOfTrigger({
		engine: lix.engine!,
		sql,
		tokens,
		parameters: [],
		op: "insert",
	});
	expect(result).toBeNull();
		} finally {
			await lix.close();
		}
	});

	test("version update enforces global scope", async () => {
		const lix = await openLix({});
		try {
			const sql = "UPDATE version SET name = 'demo' WHERE id = 'v1'";
			const tokens = tokenize(sql);
	const rewritten = maybeRewriteInsteadOfTrigger({
		engine: lix.engine!,
		sql,
		tokens,
		parameters: [],
		op: "update",
	});
	expect(rewritten).toBeNull();
		} finally {
			await lix.close();
		}
	});

	test("custom view DML uses registered handler", async () => {
	const lix = await openLix({});
	lix.engine!.sqlite.exec(`
		CREATE VIEW custom_view AS SELECT schema_key FROM internal_state_vtable;
		CREATE TRIGGER custom_view_insert
		INSTEAD OF INSERT ON custom_view
		BEGIN
			SELECT schema_key FROM internal_state_vtable;
		END;
	`);

	const sql = "INSERT INTO custom_view DEFAULT VALUES";
	const tokens = tokenize(sql);
	const result = maybeRewriteInsteadOfTrigger({
		engine: lix.engine!,
		sql,
		tokens,
		parameters: [],
		op: "insert",
	});

expect(result?.sql).toMatch(/SELECT\s+schema_key\s+FROM\s+internal_state_vtable/i);

const rewrite = lix.engine!.preprocessQuery({
	sql: result!.sql,
	parameters: result!.parameters,
	sideEffects: false,
});

expect(rewrite.sql).toContain("internal_state_vtable_rewritten");

	await lix.close();
	});
});
