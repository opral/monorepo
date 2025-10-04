import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createCheckpoint } from "../state/create-checkpoint.js";
import { selectWorkingDiff } from "./select-working-diff.js";
import { LixKeyValueSchema } from "../key-value/schema-definition.js";

const FILE_ID = "lix"; // key_value is stored under hardcoded file_id 'lix'
const KV_SCHEMA = LixKeyValueSchema["x-lix-key"];

// Manually select base diff columns from the aliased subquery "diff"
const selectBaseDiffCols = [
	"entity_id",
	"schema_key",
	"file_id",
	"before_version_id",
	"before_change_id",
	"before_commit_id",
	"after_version_id",
	"after_change_id",
	"after_commit_id",
	"status",
] as const;

async function setKeyValue(lix: any, key: string, value: any) {
	// Safe upsert for vtable-backed entity: check existence first
	const existing = await lix.db
		.selectFrom("key_value")
		.where("key", "=", key)
		.select("key")
		.executeTakeFirst();
	if (existing) {
		await lix.db
			.updateTable("key_value")
			.set({ value })
			.where("key", "=", key)
			.execute();
	} else {
		await lix.db.insertInto("key_value").values({ key, value }).execute();
	}
}

async function delKeyValue(lix: any, key: string) {
	await lix.db.deleteFrom("key_value").where("key", "=", key).execute();
}

async function workingCommitId(lix: any): Promise<string> {
	const row = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.working_commit_id")
		.executeTakeFirstOrThrow();
	return row.working_commit_id;
}

test("added: new key after checkpoint", async () => {
	const lix = await openLix({});
	await createCheckpoint({ lix });

	await setKeyValue(lix, "kv1", "A");

	const wcid = await workingCommitId(lix);

	const rows = await selectWorkingDiff({ lix })
		.where("file_id", "=", FILE_ID)
		.where("schema_key", "=", KV_SCHEMA)
		.select(selectBaseDiffCols as any)
		.execute();

	expect(rows.length).toBeGreaterThan(0);
	const created = rows.find(
		(r) => r.status === "added" && r.entity_id === "kv1"
	);
	expect(created).toBeTruthy();
	expect(created?.before_commit_id).toBeNull();
	expect(created?.after_commit_id).toBe(wcid);
	// Assert the value in the after change snapshot is 'A'
	expect(created?.after_change_id).toBeTruthy();
	const afterCreated = await lix.db
		.selectFrom("change")
		.where("id", "=", created!.after_change_id as string)
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(afterCreated.snapshot_content?.value).toBe("A");
});

test("modified: key changed since last checkpoint", async () => {
	const lix = await openLix({});
	await createCheckpoint({ lix });

	await setKeyValue(lix, "kv2", "A");
	await createCheckpoint({ lix });

	await setKeyValue(lix, "kv2", "B");

	const rows = await selectWorkingDiff({ lix })
		.where("file_id", "=", FILE_ID)
		.where("schema_key", "=", KV_SCHEMA)
		.select(selectBaseDiffCols as any)
		.execute();

	const updated = rows.find(
		(r) => r.status === "modified" && r.entity_id === "kv2"
	);
	expect(updated).toBeTruthy();
	expect(updated?.before_commit_id).toBeTruthy();
	expect(updated?.after_commit_id).toBeTruthy();
	expect(updated?.before_change_id).toBeTruthy();
	expect(updated?.after_change_id).toBeTruthy();
	// change ids must differ
	expect(updated!.before_change_id).not.toBe(updated!.after_change_id);
	// Assert before/after values are 'A' -> 'B'
	const beforeUpdated = await lix.db
		.selectFrom("change")
		.where("id", "=", updated!.before_change_id as string)
		.selectAll()
		.executeTakeFirstOrThrow();
	const afterUpdated = await lix.db
		.selectFrom("change")
		.where("id", "=", updated!.after_change_id as string)
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(beforeUpdated.snapshot_content?.value).toBe("A");
	expect(afterUpdated.snapshot_content?.value).toBe("B");
});

test("removed: key removed since last checkpoint", async () => {
	const lix = await openLix({});
	await createCheckpoint({ lix });

	await setKeyValue(lix, "kv3", "X");

	await createCheckpoint({ lix });

	await delKeyValue(lix, "kv3");

	const rows = await selectWorkingDiff({ lix })
		.where("file_id", "=", FILE_ID)
		.where("schema_key", "=", KV_SCHEMA)
		.select(selectBaseDiffCols)
		.execute();

	const deleted = rows.find(
		(r) => r.status === "removed" && r.entity_id === "kv3"
	);

	expect(deleted).toBeTruthy();
	expect(deleted?.before_commit_id).toBeTruthy();
	expect(deleted?.after_commit_id).toBeTruthy();
	// Assert before had 'X' and after is a tombstone (null)
	expect(deleted?.before_change_id).toBeTruthy();
	expect(deleted?.after_change_id).toBeTruthy();
	const beforeDeleted = await lix.db
		.selectFrom("change")
		.where("id", "=", deleted!.before_change_id)
		.selectAll()
		.executeTakeFirstOrThrow();
	const afterDeleted = await lix.db
		.selectFrom("change")
		.where("id", "=", deleted!.after_change_id)
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(beforeDeleted.snapshot_content?.value).toBe("X");
	expect(afterDeleted.snapshot_content).toBeNull();
});

test("unchanged: no working changes returns no added/modified/removed", async () => {
	const lix = await openLix({});
	await createCheckpoint({ lix });

	const rows = await selectWorkingDiff({ lix })
		.where("file_id", "=", FILE_ID)
		.where("schema_key", "=", KV_SCHEMA)
		.select(selectBaseDiffCols)
		.execute();

	expect(rows.length).toBe(0);
});

test("latest checkpoint chosen as before", async () => {
	const lix = await openLix({});
	await createCheckpoint({ lix });

	// A: create key t='A' and checkpoint
	await setKeyValue(lix, "t", "A");
	const A = await createCheckpoint({ lix });

	// B: change t so it's included in the latest checkpoint
	await setKeyValue(lix, "t", "A1");
	await createCheckpoint({ lix });

	// Working change: update t to new value
	await setKeyValue(lix, "t", "B2");

	const rows = await selectWorkingDiff({ lix })
		.where("file_id", "=", FILE_ID)
		.where("schema_key", "=", KV_SCHEMA)
		.where("entity_id", "=", "t")
		.select(selectBaseDiffCols)
		.execute();

	const row = rows[0];
	expect(row).toBeTruthy();
	expect(row?.status).toBe("modified");
	expect(row?.before_commit_id).toBeTruthy();
	expect(row?.before_commit_id).not.toBe(A.id);
});

test("after_commit_id equals active working commit id", async () => {
	const lix = await openLix({});
	await createCheckpoint({ lix });
	await setKeyValue(lix, "wk1", "Z");
	const wcid = await workingCommitId(lix);

	const rows = await selectWorkingDiff({ lix })
		.where("entity_id", "=", "wk1")
		.select(selectBaseDiffCols)
		.execute();
	expect(rows.length).toBe(1);
	expect(rows[0]!.after_commit_id).toBe(wcid);
});

test("before_* columns are null when no prior checkpoint", async () => {
	const lix = await openLix({});
	// NOTE: no checkpoint before first change
	await setKeyValue(lix, "ncp", "A");

	const rows = await selectWorkingDiff({ lix })
		.where("entity_id", "=", "ncp")
		.select(selectBaseDiffCols)
		.execute();
	expect(rows.length).toBe(1);
	const r = rows[0]!;
	expect(r.status).toBe("added");
	expect(r.before_commit_id).toBeNull();
	expect(r.before_change_id).toBeNull();
	expect(r.before_version_id).toBeNull();
});

test("stable sorting by entity_id", async () => {
	const lix = await openLix({});
	await createCheckpoint({ lix });
	await setKeyValue(lix, "b", 1);
	await setKeyValue(lix, "a", 1);
	await setKeyValue(lix, "c", 1);

	const rows = await selectWorkingDiff({ lix })
		.orderBy("entity_id", "asc")
		.select(selectBaseDiffCols)
		.execute();
	const ids = rows.map((r) => r.entity_id);
	expect(ids).toEqual([...ids].sort());
});

test("returns unchanged rows for non-inherited state when no working edits", async () => {
	const lix = await openLix({});
	// Create a non-inherited tracked key in the active version and checkpoint it
	await setKeyValue(lix, "kvU", "X");
	await createCheckpoint({ lix });

	// No further edits; working diff should include 'unchanged' for kvU
	const rows = await selectWorkingDiff({ lix })
		.where("file_id", "=", FILE_ID)
		.where("schema_key", "=", KV_SCHEMA)
		.where("entity_id", "=", "kvU")
		.select(selectBaseDiffCols)
		.execute();

	expect(rows.length).toBe(1);
	const r = rows[0]!;
	expect(r.status).toBe("unchanged");
	// Optional: when unchanged, before/after change ids should match if present
	if (r.before_change_id && r.after_change_id) {
		expect(r.before_change_id).toBe(r.after_change_id);
	}
});
