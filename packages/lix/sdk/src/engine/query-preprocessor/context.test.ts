import { describe, expect, test } from "vitest";
import {
	applyRewriteResult,
	createPreprocessContext,
	detectStatementKind,
	expandContextSql,
} from "./context.js";
import { tokenize } from "../sql-parser/tokenizer.js";
import { openLix } from "../../lix/index.js";

const deterministicConfig = [
	{
		key: "lix_deterministic_mode",
		value: { enabled: true },
		lixcol_version_id: "global",
	},
];

describe("query-preprocessor context", () => {
	test("detectStatementKind identifies select statements", () => {
		const tokens = tokenize("SELECT 1");
		expect(detectStatementKind(tokens)).toBe("select");
	});

	test("createPreprocessContext tokenizes and records metadata", async () => {
		const lix = await openLix({ keyValues: deterministicConfig });
		const context = createPreprocessContext({
			engine: lix.engine!,
			sql: "SELECT 1",
			parameters: [],
		});
		expect(context.originalSql).toBe("SELECT 1");
		expect(context.tokens.length).toBeGreaterThan(0);
		expect(context.kind).toBe("select");
	});

	test("applyRewriteResult updates sql and resets expansion", async () => {
		const lix = await openLix({ keyValues: deterministicConfig });
		const context = createPreprocessContext({
			engine: lix.engine!,
			sql: "SELECT 1",
			parameters: [],
		});
		context.expandedSql = "WITH demo AS (SELECT 1)";
		applyRewriteResult(context, {
			sql: "SELECT 2",
		});
		expect(context.sql).toBe("SELECT 2");
		expect(context.expandedSql).toBeUndefined();
		expect(context.kind).toBe("select");
	});

	test("expandContextSql expands sqlite views referencing the state vtable", async () => {
		const lix = await openLix({ keyValues: deterministicConfig });
		lix.engine!.sqlite.exec({
			sql: `CREATE VIEW __context_test_view AS
				SELECT * FROM lix_internal_state_vtable`,
			returnValue: "resultRows",
		});
		const context = createPreprocessContext({
			engine: lix.engine!,
			sql: "SELECT * FROM __context_test_view",
			parameters: [],
		});
		expandContextSql(context);
		expect(context.expandedSql).toBeDefined();
		expect(context.sql).toContain(
			"FROM ( SELECT * FROM lix_internal_state_vtable"
		);
		lix.engine!.sqlite.exec({
			sql: "DROP VIEW __context_test_view",
			returnValue: "resultRows",
		});
	});

	test("expandContextSql leaves expandedSql undefined when nothing changes", async () => {
		const lix = await openLix({ keyValues: deterministicConfig });
		const context = createPreprocessContext({
			engine: lix.engine!,
			sql: "SELECT 1",
			parameters: [],
		});
		expandContextSql(context);
		expect(context.expandedSql).toBeUndefined();
		expect(context.sql).toBe("SELECT 1");
	});
});
