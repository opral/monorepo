import { google } from "@ai-sdk/google";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runTextComparison } from "./text.eval.ts";
import { runSchemaComparison } from "./schema.eval.ts";

type RunResult = {
	title: string;
	text: string;
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
};

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const beforePath = path.join(__dirname, "before.md");
const afterPath = path.join(__dirname, "after.md");
const comparePath = path.join(__dirname, "compare.md");

const before = await fs.readFile(beforePath, "utf-8");
const after = await fs.readFile(afterPath, "utf-8");

const model = google("gemini-2.5-flash");

async function runText(): Promise<RunResult> {
	const { text, usage } = await runTextComparison({ before, after, model });
	return {
		title: "Text-based comparison (Before/After)",
		text,
		inputTokens: usage?.inputTokens,
		outputTokens: usage?.outputTokens,
		totalTokens: usage?.totalTokens,
	};
}

async function runSchema(): Promise<RunResult> {
	const { text, usage } = await runSchemaComparison({ before, after, model });
	return {
		title: "Schema-based comparison (selectWorkingDiff)",
		text,
		inputTokens: usage?.inputTokens,
		outputTokens: usage?.outputTokens,
		totalTokens: usage?.totalTokens,
	};
}

const textRes = await runText();
const schemaRes = await runSchema();

const report = [
	"# Compare Commit Messages\n",
	"## Text-based\n",
	textRes.text,
	"\n\nMetrics:\n",
	`- inputTokens: ${textRes.inputTokens ?? "n/a"}`,
	`- outputTokens: ${textRes.outputTokens ?? "n/a"}`,
	`- totalTokens: ${textRes.totalTokens ?? "n/a"}`,
	"\n\n---\n\n",
	"## Schema-based\n",
	schemaRes.text,
	"\n\nMetrics:\n",
	`- inputTokens: ${schemaRes.inputTokens ?? "n/a"}`,
	`- outputTokens: ${schemaRes.outputTokens ?? "n/a"}`,
	`- totalTokens: ${schemaRes.totalTokens ?? "n/a"}`,
	"\n",
].join("\n");

await fs.writeFile(comparePath, report, "utf-8");
console.log(`Wrote ${comparePath}`);
