import { describe, expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { tokenize } from "../../sql-parser/tokenizer.js";
import { maybeRewriteInsteadOfTrigger } from "./rewrite.js";
import { registerTriggerHandler } from "./handlers.js";

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

	test("invokes registered handler when trigger is present", async () => {
		const lix = await openLix({});

		lix.engine!.sqlite.exec(`
			CREATE VIEW rewrite_view AS SELECT 1 AS value;
			CREATE TRIGGER rewrite_view_insert
			INSTEAD OF INSERT ON rewrite_view
			BEGIN
				SELECT 'trigger body';
			END;
		`);

		registerTriggerHandler("rewrite_view", "insert", () => ({
			sql: "SELECT 42",
			parameters: [],
		}));

		const tokens = tokenize("INSERT INTO rewrite_view DEFAULT VALUES");
		const rewritten = maybeRewriteInsteadOfTrigger({
			engine: lix.engine!,
			sql: "INSERT INTO rewrite_view DEFAULT VALUES",
			tokens,
			parameters: [],
			op: "insert",
		});

		expect(rewritten).not.toBeNull();
		expect(rewritten?.sql).toBe("SELECT 42");

		await lix.close();
	});
});
