import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createCheckpoint, openLix, selectWorkingDiff } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const lix = await openLix({ providePlugins: [mdPlugin] });

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const beforePath = path.join(__dirname, "before.md");
const afterPath = path.join(__dirname, "after.md");

const before = await fs.readFile(beforePath, "utf-8");
const after = await fs.readFile(afterPath, "utf-8");

// baseline 0 changes in checkpoint
await createCheckpoint({ lix });

await lix.db
	.insertInto("file")
	.values({
		path: "/getting-started.md",
		data: new TextEncoder().encode(before),
	})
	.execute();

await lix.db
	.updateTable("file")
	.set({ data: new TextEncoder().encode(after) })
	.where("path", "=", "/getting-started.md")
	.execute();

const model = google("gemini-2.5-flash");

const prompt = [
	"You are writing a commit message describing changes between two Markdown documents (Before → After).",
	"IMPORTANT: Output ONLY 1-3 short paragraphs (plain text). No headings, no lists, no code fences, no preamble.",
	"Use neutral, imperative voice (Add…, Update…, Remove…). Prefer human meaning over low-level details.",
	"Algorithm:\n1) Identify added / updated / removed sections.\n2) Summarize meaningful edits (e.g., new sections, reworded intros, tool changes).\n3) Keep it succinct.",
	"Good (plain text):\nAdd setup instructions for .env and deployment. Update package manager guidance to pnpm. Refine intro and usage notes.",
	"Bad:\nHere is a summary: …\n### Summary\n- Bulleted list…\n``` … ```",
	"\nBefore:\n" + before,
	"\nAfter:\n" + after,
].join("\n\n");

const { text } = await generateText({ model, prompt });
console.log(text);
