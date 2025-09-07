import { createCheckpoint, openLix } from "@lix-js/sdk";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const lix = await openLix({
	keyValues: [
		{
			key: "lix_deterministic_mode",
			value: { enabled: true },
			lixcol_version_id: "global",
		},
	],
});

// Baseline checkpoint so we can describe subsequent changes
await createCheckpoint({ lix });

await lix.db
	.insertInto("key_value")
	.values({
		key: "test_key",
		value: { some: "value" },
	})
	.execute();

// Pull a small sample of rows to summarize (using the state view)
const rows = await lix.db
	.selectFrom("state")
	.where("schema_key", "=", "lix_key_value")
	.orderBy("created_at", "desc")
	.select([
		"entity_id",
		"file_id",
		"schema_key",
		"created_at",
		"snapshot_content",
	])
	.limit(5)
	.execute();

const model = google("gemini-2.5-flash");

const prompt = [
	"You are an assistant summarizing working changes in a Lix workspace.",
	"Summarize the following recent state rows in 4-6 bullets, focusing on user-facing meaning.",
	"Prefer concise, neutral phrasing.",
	"\nRows:\n" + JSON.stringify(rows, null, 2),
].join("\n\n");

const { text } = await generateText({ model, prompt });

console.log("\n=== Working Changes Summary ===\n");
console.log(text);
console.log("\n(Queried", rows.length, "rows from state)");
