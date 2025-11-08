import { test } from "vitest";
import { promises as fs } from "fs";
import { openLix } from "../lix/open-lix.js";
import { createExplainQuery } from "../engine/explain-query.js";
import type { Lix } from "../lix/open-lix.js";

type ExplainStage = ReturnType<ReturnType<typeof createExplainQuery>>;

type Captured = {
	sql: string;
	parameters: unknown[];
	stage: ExplainStage;
};

const playgroundOutput = decodeURIComponent(
	new URL("../state-insert.query-plan.txt", import.meta.url).pathname
);

test(
	"playground: explain queries during state inserts",
	{ timeout: 20_000 },
	async () => {
	const lix = await openLix({});
	const captured = await captureStateInsertQueries({
		lix,
		fileId: "playground-file",
		count: 200,
	});
	await lix.close();

	const text = formatExplainStages(captured);
	await fs.writeFile(playgroundOutput, text, "utf8");
	}
);

async function captureStateInsertQueries(args: {
	lix: Lix;
	fileId: string;
	count: number;
}): Promise<Captured[]> {
	const { lix, fileId, count } = args;
	const captured: Captured[] = [];
	const originalExecute = lix.engine!.executeSync;
	const explain = createExplainQuery({ engine: lix.engine! });
	let explaining = false;
	lix.engine!.executeSync = ((
		queryArgs: Parameters<typeof originalExecute>[0]
	) => {
		if (explaining) {
			return originalExecute(queryArgs);
		}
		const parameters = Array.isArray(queryArgs.parameters)
			? queryArgs.parameters
			: queryArgs.parameters
				? [queryArgs.parameters]
				: [];
		let stage: ExplainStage | null = null;
		try {
			explaining = true;
			stage = explain({
				sql: queryArgs.sql,
				parameters,
			});
		} finally {
			explaining = false;
		}
		if (stage) {
			captured.push({
				sql: queryArgs.sql,
				parameters,
				stage,
			});
		}
		return originalExecute(queryArgs);
	}) as typeof originalExecute;

	try {
		await seedStateRows({ lix, fileId, count });
	} finally {
		lix.engine!.executeSync = originalExecute;
	}

	return captured;
}

async function seedStateRows(args: {
	lix: Lix;
	fileId: string;
	count: number;
}) {
	const { lix, fileId, count } = args;

	const schema = {
		"x-lix-key": "playground_markdown_block",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
			text: { type: "string" },
		},
		required: ["id", "text"],
		additionalProperties: false,
	} as const;

	const documentSchema = {
		"x-lix-key": "playground_document",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
			order: {
				type: "array",
				items: { type: "string" },
			},
		},
		required: ["id", "order"],
		additionalProperties: false,
	} as const;

	await lix.db
		.insertInto("stored_schema_by_version")
		.values([
			{ value: schema, lixcol_version_id: "global" },
			{ value: documentSchema, lixcol_version_id: "global" },
		])
		.execute();

	const { version_id: versionId } = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const rows: any[] = [];
	for (let i = 0; i < count; i++) {
		rows.push({
			entity_id: `block-${i + 1}`,
			schema_key: schema["x-lix-key"],
			file_id: fileId,
			plugin_key: "playground_plugin",
			snapshot_content: { id: `block-${i + 1}`, text: `Paragraph ${i + 1}` },
			schema_version: schema["x-lix-version"],
			version_id: versionId,
		});
	}

	const CHUNK = 200;
	for (let i = 0; i < rows.length; i += CHUNK) {
		const slice = rows.slice(i, i + CHUNK);
		await lix.db.insertInto("state_by_version").values(slice).execute();
	}

	await lix.db
		.insertInto("state_by_version")
		.values({
			entity_id: "root",
			schema_key: documentSchema["x-lix-key"],
			file_id: fileId,
			plugin_key: "playground_plugin",
			snapshot_content: {
				id: "root",
				order: rows.map((row) => row.entity_id),
			},
			schema_version: documentSchema["x-lix-version"],
			version_id: versionId,
		})
		.execute();
}

function formatExplainStages(entries: Captured[]): string {
	const now = new Date().toISOString();
	const sections = entries.map((entry, idx) => {
		const planLines =
			entry.stage.plan.length === 0
				? ["(no plan rows returned)"]
				: entry.stage.plan.map((planRow: Record<string, unknown>) =>
						Object.entries(planRow)
							.map(([key, value]) => `${key}=${value}`)
							.join(", ")
					);
		return [
			`# Query ${idx + 1}`,
			`Original SQL:\n${entry.sql}`,
			entry.stage.rewrittenSql
				? `Rewritten SQL:\n${entry.stage.rewrittenSql}`
				: "Rewritten SQL: (not rewritten)",
			entry.parameters.length
				? `Parameters:\n${entry.parameters
						.map(
							(param, paramIdx) =>
								`  $${paramIdx + 1}: ${JSON.stringify(param)}`
						)
						.join("\n")}`
				: "Parameters: (none)",
			"Plan:",
			...planLines.map((line) => `  • ${line}`),
		].join("\n\n");
	});
	return [
		"State insert query plan playground",
		`Generated at: ${now}`,
		...sections,
	].join("\n\n");
}
