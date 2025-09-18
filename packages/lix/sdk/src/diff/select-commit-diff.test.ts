import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createCheckpoint } from "../state/create-checkpoint.js";
import { selectCommitDiff } from "./select-commit-diff.js";

test("selectCommitDiff: added/modified/unchanged between two commits", async () => {
	const lix = await openLix({});

	// Seed initial state: a=1, c=3
	await lix.db.insertInto("key_value").values({ key: "a", value: 1 }).execute();
	await lix.db.insertInto("key_value").values({ key: "c", value: 3 }).execute();

	const c1 = await createCheckpoint({ lix });

	// Next commit: modify a, add b
	await lix.db
		.updateTable("key_value")
		.set({ value: 2 })
		.where("key", "=", "a")
		.execute();
	await lix.db
		.insertInto("key_value")
		.values({ key: "b", value: 20 })
		.execute();

	const c2 = await createCheckpoint({ lix });

	// Diff c1 -> c2
	const rows = await selectCommitDiff({ lix, before: c1.id, after: c2.id })
		.where("diff.schema_key", "=", "lix_key_value")
		.where("diff.file_id", "=", "lix")
		.selectAll()
		.execute();

	// Expect three rows: a modified, b added, c unchanged
	const byKey = new Map(rows.map((r) => [r.entity_id, r]));
	expect(byKey.get("a")?.status).toBe("modified");
	expect(byKey.get("b")?.status).toBe("added");
	expect(byKey.get("c")?.status).toBe("unchanged");

	await lix.close();
});

test("selectCommitDiff: removed between two commits", async () => {
	const lix = await openLix({});

	// Seed: b only
	await lix.db.insertInto("key_value").values({ key: "b", value: 1 }).execute();
	const c1 = await createCheckpoint({ lix });

	// Delete b
	await lix.db.deleteFrom("key_value").where("key", "=", "b").execute();
	const c2 = await createCheckpoint({ lix });

	const rows = await selectCommitDiff({ lix, before: c1.id, after: c2.id })
		.where("diff.schema_key", "=", "lix_key_value")
		.where("diff.file_id", "=", "lix")
		.selectAll()
		.execute();

	const b = rows.find((r) => r.entity_id === "b");
	expect(b?.status).toBe("removed");

	await lix.close();
});
