import { createCheckpoint, openLix } from "@lix-js/sdk";
import { google } from "@ai-sdk/google";
import { createLixAgent, summarizeWorkingChanges } from "../dist/index.js";

const lix = await openLix({
	keyValues: [
		{
			key: "lix_deterministic_mode",
			value: { enabled: true },
			lixcol_version_id: "global",
		},
	],
});

const model = google("gemini-2.5-flash");
const agent = await createLixAgent({ lix, model });

// Baseline checkpoint so we can describe subsequent changes
await createCheckpoint({ lix });

await lix.db
	.insertInto("key_value")
	.values({
		key: "test_key",
		value: { some: "value" },
	})
	.execute();

await createCheckpoint({ lix });

await lix.db
	.updateTable("key_value")
	.set({ value: { some: "new value" } })
	.where("key", "=", "test_key")
	.execute();

const { text } = await summarizeWorkingChanges({ agent });

console.log(text);
