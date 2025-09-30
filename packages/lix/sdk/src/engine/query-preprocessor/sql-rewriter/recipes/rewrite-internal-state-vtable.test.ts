import { expect, test } from "vitest";
import { tokenize } from "../tokenizer.js";
import { analyzeShape } from "../microparser/analyze-shape.js";
import { rewriteInternalStateVtableQuery } from "./rewrite-internal-state-vtable.js";
import { openLix } from "../../../../lix/open-lix.js";

test("rewrites a simple internal_state_vtable select", () => {
	const sql = `SELECT * FROM internal_state_vtable;`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);
	expect(shape).not.toBeNull();

	const rewritten = rewriteInternalStateVtableQuery(shape!);
	expect(rewritten).toBeTruthy();
	expect(rewritten).toContain("WITH RECURSIVE");
	expect(rewritten).toContain("internal_state_cache");
});

test("passes literal schema key into cache routing", () => {
	const sql = `SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'lix_key_value';`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);

	expect(shape).not.toBeNull();

	const rewritten = rewriteInternalStateVtableQuery(shape!);
	expect(rewritten).toBeTruthy();
	expect(rewritten).toContain("lix_key_value");
});

test("uses fast path for limit 1 queries", async () => {
	const sql = `SELECT * FROM internal_state_vtable v WHERE v.schema_key = 'lix_key_value' LIMIT 1;`;
	const tokens = tokenize(sql);
	const shape = analyzeShape(tokens);
	expect(shape).not.toBeNull();

	const rewritten = rewriteInternalStateVtableQuery(shape!);
	expect(rewritten).toBeTruthy();
	expect(rewritten).toContain("LIMIT 1");
	expect(rewritten).toContain("internal_transaction_state");
	expect(rewritten).not.toContain("WITH RECURSIVE");

	const rewrittenQuery = `SELECT * FROM (${rewritten}) AS v;`;
	const plan = await explainQueryPlan(rewrittenQuery);

	expect(plan).not.toContain("internal_state_vtable");
	expect(plan).toMatchSnapshot();
});

async function explainQueryPlan(sql: string): Promise<string> {
	const lix = await openLix({});
	const sanitized = sql.trim().replace(/;$/, "");
	try {
		const { rows } = lix.engine!.executeSync({
			sql: `EXPLAIN QUERY PLAN ${sanitized}`,
			parameters: [],
		});
		return rows
			.map((row) =>
				Object.values(row)
					.map((value) =>
						value === null || value === undefined ? "" : String(value)
					)
					.join("|")
			)
			.join("\n");
	} finally {
		await lix.close();
	}
}
