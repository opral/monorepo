import { describe, expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { tokenize } from "../../sql-parser/tokenizer.js";
import { maybeRewriteInsteadOfTrigger } from "./rewrite.js";

describe("rewriteUsingTrigger", () => {
	test("returns null when no trigger exists", async () => {
		const lix = await openLix({});
		const tokens = tokenize("INSERT INTO missing_view VALUES (1)");

		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql: "INSERT INTO missing_view VALUES (1)",
			tokens,
			parameters: [],
			op: "insert",
		});

		expect(rewritten).toBeNull();
		await lix.close();
	});

	test("returns trigger body when no NEW/OLD references", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
		CREATE VIEW rewrite_view AS SELECT schema_key FROM internal_state_vtable;
		CREATE TRIGGER rewrite_view_insert
		INSTEAD OF INSERT ON rewrite_view
		BEGIN
			SELECT schema_key FROM internal_state_vtable;
		END;
	`);

		const tokens = tokenize("INSERT INTO rewrite_view DEFAULT VALUES");
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql: "INSERT INTO rewrite_view DEFAULT VALUES",
			tokens,
			parameters: [],
			op: "insert",
		});

		const normalized = rewritten?.sql.trim().replace(/;$/, "");
		expect(normalized).toBe("SELECT schema_key FROM internal_state_vtable");

		const postRewrite = lix.engine!.preprocessQuery({
			sql: rewritten!.sql,
			parameters: rewritten!.parameters,
			sideEffects: false,
		});

		expect(postRewrite.sql).toContain("internal_state_vtable_rewritten");
		await lix.close();
	});

	test("falls back when trigger references NEW context", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
			CREATE VIEW new_view AS SELECT 1;
			CREATE TRIGGER new_view_insert
			INSTEAD OF INSERT ON new_view
			BEGIN
				SELECT NEW.value;
			END;
		`);

		const tokens = tokenize("INSERT INTO new_view DEFAULT VALUES");
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql: "INSERT INTO new_view DEFAULT VALUES",
			tokens,
			parameters: [],
			op: "insert",
		});

		expect(rewritten).toBeNull();
		await lix.close();
	});
});
