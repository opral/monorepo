import { test, expect } from "vitest";
import { writeFile } from "node:fs/promises";
import { detectChanges } from "./detect-changes.js";
import { plugin } from "./index.js";
import { openLix, createQuerySync } from "../../sdk/dist/index.js";
import { createExplainQuery } from "../../sdk/dist/engine/explain-query.js";
import { parseMarkdown, AstSchemas } from "@opral/markdown-wc";
import type { Ast } from "@opral/markdown-wc";
import type { Lix, LixPlugin } from "@lix-js/sdk";

type ExplainQueryStage = ReturnType<ReturnType<typeof createExplainQuery>>;

type DetectChangesArgs = Parameters<NonNullable<LixPlugin["detectChanges"]>>[0];

const encode = (text: string) => new TextEncoder().encode(text);

type CapturedQuery = {
	sql: string;
	parameters: readonly unknown[];
};

/**
 * Seed the markdown blocks for a file so the detectChanges pipeline
 * touches the same cache tables as production runs.
 *
 * @example
 * await seedMarkdownState({
 *   lix,
 *   fileId: "demo",
 *   markdown: "# Title\n\nParagraph",
 *   ids: ["h1", "p1"]
 * })
 */
async function seedMarkdownState(args: {
	lix: Lix;
	fileId: string;
	markdown: string;
	ids?: string[];
}) {
	const { lix, fileId, markdown, ids } = args;
	const ast = parseMarkdown(markdown) as Ast;
	const schemas = AstSchemas.allSchemas.map((schema) => ({
		value: schema,
		lixcol_version_id: "global",
	}));
	await lix.db.insertInto("stored_schema_by_version").values(schemas).execute();
	const order: string[] = [];
	const { version_id: versionId } = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();
	const values: any[] = [];
	for (let i = 0; i < (ast.children as any[]).length; i++) {
		const n: any = (ast.children as any[])[i];
		const id = ids?.[i] ?? `node_${i + 1}`;
		n.data = { ...(n.data || {}), id };
		order.push(id);
		values.push({
			entity_id: id,
			schema_key: (AstSchemas.schemasByType as any)[n.type]["x-lix-key"],
			file_id: fileId,
			plugin_key: plugin.key,
			snapshot_content: n,
			schema_version: (AstSchemas.schemasByType as any)[n.type][
				"x-lix-version"
			],
			version_id: versionId,
		});
	}
	const CHUNK = 200;
	for (let i = 0; i < values.length; i += CHUNK) {
		const slice = values.slice(i, i + CHUNK);
		await lix.db.insertInto("state_by_version").values(slice).execute();
	}
	await lix.db
		.insertInto("state_by_version")
		.values({
			entity_id: "root",
			schema_key: AstSchemas.DocumentSchema["x-lix-key"],
			file_id: fileId,
			plugin_key: plugin.key,
			snapshot_content: { order },
			schema_version: AstSchemas.DocumentSchema["x-lix-version"],
			version_id: versionId,
		})
		.execute();
}

/**
 * Capture the SQL that runs during detectChanges and attach an EXPLAIN plan.
 *
 * @example
 * const plans = await runDetectChangesWithExplain({ ... })
 */
async function runDetectChangesWithExplain(args: {
	lix: Lix;
	fileId: string;
	markdown: string;
	afterMarkdown: string;
}): Promise<
	Array<
		CapturedQuery & {
			stage: ExplainQueryStage;
		}
	>
> {
	const { lix, fileId, markdown, afterMarkdown } = args;
	await seedMarkdownState({ lix, fileId, markdown });
	const engine = lix.engine!;
	const querySync = createQuerySync({ engine });
	const explain = createExplainQuery({ engine });
	const captured: CapturedQuery[] = [];
	const originalExecute = engine.executeSync;
	engine.executeSync = ((sqlArgs) => {
		captured.push({
			sql: sqlArgs.sql,
			parameters: Array.isArray(sqlArgs.parameters)
				? sqlArgs.parameters
				: sqlArgs.parameters
					? [sqlArgs.parameters]
					: [],
		});
		return originalExecute(sqlArgs);
	}) as typeof originalExecute;
	try {
		detectChanges({
			querySync,
			after: {
				id: fileId,
				path: `${fileId}.md`,
				data: encode(afterMarkdown),
				metadata: {},
			},
		} as DetectChangesArgs);
	} finally {
		engine.executeSync = originalExecute;
	}
	return captured.map((entry) => ({
		...entry,
		stage: explain({
			sql: entry.sql,
			parameters: [...entry.parameters],
		}),
	}));
}

/**
 * Convert the captured explain stages into a text artifact for manual inspection.
 *
 * @example
 * const text = formatExplainStages(captured)
 */
function formatExplainStages(
	rows: Array<CapturedQuery & { stage: ExplainQueryStage }>,
): string {
	const now = new Date().toISOString();
	const sections = rows.map((row, idx) => {
		const planLines =
			row.stage.plan.length === 0
				? ["(no plan rows returned)"]
				: row.stage.plan.map((planRow: Record<string, unknown>) =>
						Object.entries(planRow)
							.map(([key, value]) => `${key}=${value}`)
							.join(", "),
					);
		const sameAsExecuted = row.stage.originalSql.trim() === row.sql.trim();
		return [
			`# Query ${idx + 1}`,
			`Original SQL${sameAsExecuted ? " (same as executed)" : ""}:\n${
				row.stage.originalSql
			}`,
			row.stage.rewrittenSql
				? `Rewritten SQL:\n${row.stage.rewrittenSql}`
				: "Rewritten SQL: (not rewritten)",
			`Executed SQL:\n${row.sql}`,
			row.parameters.length
				? `Parameters:\n${row.parameters
						.map(
							(param, paramIdx) =>
								`  $${paramIdx + 1}: ${JSON.stringify(param)}`,
						)
						.join("\n")}`
				: "Parameters: (none)",
			"Plan:",
			...planLines.map((line) => `  • ${line}`),
		].join("\n\n");
	});
	return [
		"DetectChanges query plan playground",
		`Generated at: ${now}`,
		...sections,
	].join("\n\n");
}

test(
	"playground: explain detectChanges queries for markdown nodes",
	{ timeout: 30_000 },
	async () => {
		const lix = await openLix({ providePlugins: [plugin] });
		const plans = await runDetectChangesWithExplain({
			lix,
			fileId: "playground-md",
			markdown: `# Heading\n\nParagraph one.\n\nParagraph two.`,
			afterMarkdown: `# Heading\n\nParagraph one updated.\n\nParagraph two.`,
		});
		expect(plans.length).toBeGreaterThan(0);
		const outputText = formatExplainStages(plans);
		const outputUrl = new URL(
			"../detect-changes.query-plan.txt",
			import.meta.url,
		);
		await writeFile(outputUrl, outputText, "utf8");
	},
);
