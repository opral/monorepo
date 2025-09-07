import { generateText } from "ai";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { google } from "@ai-sdk/google";
import { createCheckpoint, openLix, selectWorkingDiff } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function runSchemaComparison(args: {
	before: string;
	after: string;
	model: LanguageModelV2;
}): Promise<{
	text: string;
	usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}> {
	const { before, after, model } = args;
	const lix = await openLix({ providePlugins: [mdPlugin] });

	await createCheckpoint({ lix });

	await lix.db
		.insertInto("file")
		.values({
			path: "/getting-started.md",
			data: new TextEncoder().encode(before),
		})
		.execute();

	await createCheckpoint({ lix });

	await lix.db
		.updateTable("file")
		.set({ data: new TextEncoder().encode(after) })
		.where("path", "=", "/getting-started.md")
		.execute();

	const diff = await selectWorkingDiff({ lix })
		.where("diff.status", "!=", "unchanged")
		.leftJoin("change as before", "before.id", "before_change_id")
		.leftJoin("change as after", "after.id", "after_change_id")
		.where("after.plugin_key", "=", mdPlugin.key)
		.select([
			"diff.schema_key as schema_key",
			"diff.file_id as file_id",
			"diff.status as status",
			"before.snapshot_content as before_snapshot",
			"after.snapshot_content as after_snapshot",
		])
		.execute();

	// Persist the raw diff for inspection/tuning alongside this eval file
	try {
		const diffPath = fileURLToPath(new URL("./diff.json", import.meta.url));
		await fs.writeFile(diffPath, JSON.stringify(diff, null, 2) + "\n", "utf-8");
		console.log(`Wrote diff to ${diffPath}`);
	} catch (err) {
		console.warn("Failed to write diff.json:", err);
	}

	// Also write a compact TSV version for token-efficient prompting
	let tsv = "";
	try {
		const rows = diff as WorkingDiffRow[];
		for (let i = 0; i < rows.length; i++) {
			tsv += diffRowToTsv(rows[i], i);
		}
		const tsvPath = fileURLToPath(new URL("./diff.tsv", import.meta.url));
		await fs.writeFile(tsvPath, tsv, "utf-8");
		console.log(`Wrote TSV to ${tsvPath}`);
	} catch (err) {
		console.warn("Failed to write diff.tsv:", err);
	}

	const prompt = [
		"You are writing a commit message describing the working changes since the last checkpoint in a Lix workspace.",
		"IMPORTANT: Output ONLY 1–3 short paragraphs (plain text). No headings, no lists, no code fences, no preamble.",
		"Use neutral, imperative voice (e.g., Add…, Update…, Remove…). Prefer human meaning over schema/IDs.",
		"Algorithm:\n1) Read TSV facts (one op per line).\n2) Classify each row as added / modified / removed using 'o' column.\n3) Summarize meaningful edits; ignore low-level paths and IDs.\n4) Keep it succinct.",
		"Good (plain text):\nAdd setup instructions for .env and deployment. Update package manager guidance to pnpm. Refine intro and usage notes.",
		"Bad:\nHere is a summary: …\n### Summary\n- Bulleted list…\n``` … ```",
		"Facts (TSV). Columns: r sk f o p b a\nDo not echo the TSV. Use it only to infer changes.",
		tsv,
	].join("\n\n");

	const { text, usage } = await generateText({ model, prompt });
	return { text, usage };
}

// If executed directly, run with local files and print result
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	const __dirname = fileURLToPath(new URL(".", import.meta.url));
	const beforePath = path.join(__dirname, "before.md");
	const afterPath = path.join(__dirname, "after.md");
	const before = await fs.readFile(beforePath, "utf-8");
	const after = await fs.readFile(afterPath, "utf-8");
	const model = google("gemini-2.5-flash");
	const { text } = await runSchemaComparison({ before, after, model });
	console.log(text);
}

/**
 * Convert a single working-diff row (before/after snapshots) into TSV lines.
 * Columns: r\tsk\tf\to\tp\tb\ta
 *  - r: row index (number)
 *  - sk: schema_key
 *  - f: file_id
 *  - o: op (added|modified|removed) — mapped from add|replace|remove
 *  - p: JSON-pointer path ('' normalized to '/')
 *  - b: before value as minified JSON (or null)
 *  - a: after value as minified JSON (or null)
 */
export function diffRowToTsv(row: WorkingDiffRow, rowIndex = 0): string {
	const before = row.before_snapshot ?? {};
	const after = row.after_snapshot ?? {};

	const ops = jsonDiff(before, after);

	const mapOp = (
		op: "add" | "remove" | "replace"
	): "added" | "removed" | "modified" =>
		op === "add" ? "added" : op === "remove" ? "removed" : "modified";

	const lines: string[] = [];
	for (const op of ops) {
		const cols = [
			String(rowIndex),
			row.schema_key,
			row.file_id,
			mapOp(op.op),
			op.path || "/",
			jsonMin(op.before),
			jsonMin(op.after),
		];
		lines.push(toTsv(cols));
	}
	return lines.join("\n") + (lines.length ? "\n" : "");
}

function jsonMin(v: unknown): string {
	return JSON.stringify(v === undefined ? null : v);
}

function toTsv(cols: string[]): string {
	// Escape tabs/newlines by replacing with \t, \n, \r to keep single-line TSV rows
	return cols
		.map((c) =>
			String(c)
				.replaceAll("\t", "\\t")
				.replaceAll("\n", "\\n")
				.replaceAll("\r", "\\r")
		)
		.join("\t");
}

type DiffOp = {
	op: "add" | "remove" | "replace";
	path: string;
	before?: unknown;
	after?: unknown;
};

function jsonDiff(a: unknown, b: unknown): DiffOp[] {
	const ops: DiffOp[] = [];

	function isObj(x: unknown): x is Record<string, unknown> {
		return x !== null && typeof x === "object" && !Array.isArray(x);
	}

	function eq(x: unknown, y: unknown): boolean {
		if (x === y) return true;
		if (
			typeof x === "number" &&
			typeof y === "number" &&
			Number.isNaN(x) &&
			Number.isNaN(y)
		)
			return true;
		return false;
	}

	function walk(x: unknown, y: unknown, path: string) {
		if (eq(x, y)) return;

		const xObj = isObj(x) || Array.isArray(x);
		const yObj = isObj(y) || Array.isArray(y);

		if (!xObj && !yObj) {
			ops.push({ op: "replace", path, before: x, after: y });
			return;
		}

		if (!xObj && yObj) {
			// primitive -> object/array
			ops.push({ op: "replace", path, before: x, after: y });
			return;
		}
		if (xObj && !yObj) {
			ops.push({ op: "replace", path, before: x, after: y });
			return;
		}

		if (Array.isArray(x) && Array.isArray(y)) {
			const max = Math.max(x.length, y.length);
			for (let i = 0; i < max; i++) {
				const p = path + "/" + i;
				if (i >= x.length) ops.push({ op: "add", path: p, after: y[i] });
				else if (i >= y.length)
					ops.push({ op: "remove", path: p, before: x[i] });
				else walk(x[i], y[i], p);
			}
			return;
		}

		if (isObj(x) && isObj(y)) {
			const xKeys = new Set(Object.keys(x));
			const yKeys = new Set(Object.keys(y));
			// removed keys
			for (const k of xKeys) {
				if (!yKeys.has(k))
					ops.push({
						op: "remove",
						path: path + "/" + escapeKey(k),
						before: (x as any)[k],
					});
			}
			// added or nested
			for (const k of yKeys) {
				const p = path + "/" + escapeKey(k);
				if (!xKeys.has(k))
					ops.push({ op: "add", path: p, after: (y as any)[k] });
				else walk((x as any)[k], (y as any)[k], p);
			}
			return;
		}

		// Fallback
		ops.push({ op: "replace", path, before: x, after: y });
	}

	const startA = a ?? {};
	const startB = b ?? {};
	walk(startA, startB, "");
	ops.forEach((op) => {
		if (op.path === "") op.path = "/";
	});
	return ops;
}

function escapeKey(k: string): string {
	return k.replace(/~/g, "~0").replace(/\//g, "~1");
}
