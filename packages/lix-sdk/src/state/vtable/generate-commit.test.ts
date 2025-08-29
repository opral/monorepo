import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { generateCommit } from "./generate-commit.js";
import { timestamp } from "../../deterministic/timestamp.js";
import { uuidV7 } from "../../deterministic/uuid-v7.js";

function groupBySchema(rows: any[]): Map<string, any[]> {
	const m = new Map<string, any[]>();
	for (const r of rows) {
		(m.get(r.schema_key) || m.set(r.schema_key, []).get(r.schema_key)!).push(r);
	}
	return m;
}

test("scenario 1: 1 key_value on active (with author) — 10-change model", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});
	const now = timestamp({ lix });

	// domain change on active version
	const chgId = "chg_active";
	const userChange = {
		id: chgId,
		entity_id: "kv_active",
		schema_key: "lix_key_value",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: JSON.stringify({ key: "a", value: "1" }),
		created_at: now,
		lixcol_version_id: "version-main",
	} as any;

	const res = generateCommit({
		timestamp: now,
		activeAccounts: ["acct-1"],
		changes: [userChange],
		versions: new Map([
			[
				"version-main",
				{
					parent_commit_ids: ["P_active"],
					snapshot: {
						id: "version-main",
						name: "main",
						commit_id: "ignore_active",
						working_commit_id: "work-main",
						inherits_from_version_id: "global",
						hidden: false,
					},
				},
			],
			[
				"global",
				{
					parent_commit_ids: ["P_global"],
					snapshot: {
						id: "global",
						name: "global",
						commit_id: "ignore_global",
						working_commit_id: "work-global",
						inherits_from_version_id: null,
						hidden: true,
					},
				},
			],
		]),
		generateUuid: () => uuidV7({ lix }),
	});

	const bySchema = groupBySchema(res.changes as any[]);
	// Domain + Metadata rows
	expect(bySchema.get("lix_key_value")?.length ?? 0).toBe(1);
	expect(bySchema.get("lix_change_author")?.length ?? 0).toBe(1);
	expect(bySchema.get("lix_commit")?.length ?? 0).toBe(2);
	expect(bySchema.get("lix_change_set")?.length ?? 0).toBe(2);
	expect(bySchema.get("lix_commit_edge")?.length ?? 0).toBe(2);
	expect(bySchema.get("lix_version")?.length ?? 0).toBe(2);
	// Change set elements are derived in Step 1 (no change rows)
	expect(bySchema.get("lix_change_set_element")?.length ?? 0).toBe(0);

	const commits = (bySchema.get("lix_commit") || []).map((c: any) =>
		JSON.parse(c.snapshot_content!)
	);
	// current model: commit snapshot only includes id and change_set_id
	expect(typeof commits[0].change_set_id).toBe("string");
	expect(commits[0].version_id).toBeUndefined();
	expect(commits[0].change_ids).toBeUndefined();
	expect(commits[0].author_account_ids).toBeUndefined();

	// Materialized state (cache)
	// Synthesized: domain-only CSE; domain rows are included for the commit's version
	const bySchemaMat = groupBySchema((res.materializedState as any[]) ?? []);
	expect(bySchemaMat.get("lix_key_value")?.length ?? 0).toBe(1);
	expect(bySchemaMat.get("lix_change_author")?.length ?? 0).toBe(1);
	expect(bySchemaMat.get("lix_commit")?.length ?? 0).toBe(2);
	expect(bySchemaMat.get("lix_change_set")?.length ?? 0).toBe(2);
	expect(bySchemaMat.get("lix_commit_edge")?.length ?? 0).toBe(2);
	expect(bySchemaMat.get("lix_version")?.length ?? 0).toBe(2);
	expect(bySchemaMat.get("lix_change_set_element")?.length ?? 0).toBe(10);

	// Totals per Step 1 (derived CSEs)
	expect(res.changes).toHaveLength(10);
	// materialized remains the same (derived CSEs)
	expect(res.materializedState).toHaveLength(20);
});

test("scenario 2: 1 key_value on global (with author)", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});
	const now = timestamp({ lix });

	const chgId = "chg_global";
	const userChange = {
		id: chgId,
		entity_id: "kv_global",
		schema_key: "lix_key_value",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: JSON.stringify({ key: "g", value: "1" }),
		created_at: now,
		lixcol_version_id: "global",
	} as any;

	const res = generateCommit({
		timestamp: now,
		activeAccounts: ["acct-1"],
		changes: [userChange],
		versions: new Map([
			[
				"global",
				{
					parent_commit_ids: ["P_global"],
					snapshot: {
						id: "global",
						name: "global",
						commit_id: "ignore",
						working_commit_id: "work-global",
						inherits_from_version_id: null,
						hidden: true,
					},
				},
			],
		]),
		generateUuid: () => uuidV7({ lix }),
	});

	const bySchema = groupBySchema(res.changes as any[]);
	// Only global participates
	expect(bySchema.get("lix_key_value")?.length ?? 0).toBe(1);
	expect(bySchema.get("lix_change_author")?.length ?? 0).toBe(1);
	expect(bySchema.get("lix_commit")?.length ?? 0).toBe(1);
	expect(bySchema.get("lix_change_set")?.length ?? 0).toBe(1);
	expect(bySchema.get("lix_commit_edge")?.length ?? 0).toBe(1);
	expect(bySchema.get("lix_version")?.length ?? 0).toBe(1);
	// Step 1: no CSE change rows
	expect(bySchema.get("lix_change_set_element")?.length ?? 0).toBe(0);

	const commit = JSON.parse(
		(bySchema.get("lix_commit")![0] as any).snapshot_content!
	);
	// current model: commit snapshot only includes id and change_set_id
	expect(typeof commit.change_set_id).toBe("string");
	expect(commit.version_id).toBeUndefined();
	expect(commit.change_ids).toBeUndefined();
	expect(commit.author_account_ids).toBeUndefined();

	const bySchemaMat2 = groupBySchema((res.materializedState as any[]) ?? []);
	expect(bySchemaMat2.get("lix_key_value")?.length ?? 0).toBe(1);
	expect(bySchemaMat2.get("lix_change_author")?.length ?? 0).toBe(1);
	expect(bySchemaMat2.get("lix_commit")?.length ?? 0).toBe(1);
	expect(bySchemaMat2.get("lix_change_set")?.length ?? 0).toBe(1);
	expect(bySchemaMat2.get("lix_commit_edge")?.length ?? 0).toBe(1);
	expect(bySchemaMat2.get("lix_version")?.length ?? 0).toBe(1);
	expect(bySchemaMat2.get("lix_change_set_element")?.length ?? 0).toBe(6);

	// Totals under Step 1 (no CSE rows)
	expect(res.changes).toHaveLength(6);
	// materialized unchanged (derived CSEs present)
	expect(res.materializedState).toHaveLength(12);
});

test("scenario 3: 2 key_values (active + global), each with both authors", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});
	const now = timestamp({ lix });

	const changeA = {
		id: "chg_A",
		entity_id: "kv_A",
		schema_key: "lix_key_value",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: JSON.stringify({ key: "A", value: "1" }),
		created_at: now,
		lixcol_version_id: "global",
	} as any;

	const changeB = {
		id: "chg_B",
		entity_id: "kv_B",
		schema_key: "lix_key_value",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: JSON.stringify({ key: "B", value: "1" }),
		created_at: now,
		lixcol_version_id: "version-main",
	} as any;

	const res = generateCommit({
		timestamp: now,
		activeAccounts: ["acct-1", "acct-2"],
		changes: [changeA, changeB],
		versions: new Map([
			[
				"global",
				{
					parent_commit_ids: ["P_global"],
					snapshot: {
						id: "global",
						name: "global",
						commit_id: "ignore",
						working_commit_id: "work-global",
						inherits_from_version_id: null,
						hidden: true,
					},
				},
			],
			[
				"version-main",
				{
					parent_commit_ids: ["P_active"],
					snapshot: {
						id: "version-main",
						name: "main",
						commit_id: "ignore",
						working_commit_id: "work-main",
						inherits_from_version_id: "global",
						hidden: false,
					},
				},
			],
		]),
		generateUuid: () => uuidV7({ lix }),
	});

	const bySchema = groupBySchema(res.changes as any[]);
	expect(bySchema.get("lix_key_value")?.length ?? 0).toBe(2);
	expect(bySchema.get("lix_change_author")?.length ?? 0).toBe(4);
	expect(bySchema.get("lix_commit")?.length ?? 0).toBe(2);
	expect(bySchema.get("lix_change_set")?.length ?? 0).toBe(2);
	expect(bySchema.get("lix_commit_edge")?.length ?? 0).toBe(2);
	expect(bySchema.get("lix_version")?.length ?? 0).toBe(2);
	// Step 1: no CSE change rows
	expect(bySchema.get("lix_change_set_element")?.length ?? 0).toBe(0);

	const commits = (bySchema.get("lix_commit") || []).map((c: any) =>
		JSON.parse(c.snapshot_content!)
	);
	// current model: commit snapshot only includes id and change_set_id
	commits.forEach((c: any) => {
		expect(typeof c.change_set_id).toBe("string");
		expect(c.version_id).toBeUndefined();
		expect(c.change_ids).toBeUndefined();
		expect(c.author_account_ids).toBeUndefined();
	});

	const bySchemaMat3 = groupBySchema((res.materializedState as any[]) ?? []);
	expect(bySchemaMat3.get("lix_key_value")?.length ?? 0).toBe(2);
	expect(bySchemaMat3.get("lix_change_author")?.length ?? 0).toBe(4);
	expect(bySchemaMat3.get("lix_commit")?.length ?? 0).toBe(2);
	expect(bySchemaMat3.get("lix_change_set")?.length ?? 0).toBe(2);
	expect(bySchemaMat3.get("lix_commit_edge")?.length ?? 0).toBe(2);
	expect(bySchemaMat3.get("lix_version")?.length ?? 0).toBe(2);
	expect(bySchemaMat3.get("lix_change_set_element")?.length ?? 0).toBe(14);

	// Totals under Step 1
	expect(res.changes).toHaveLength(14);
	// materialized unchanged (derived CSEs present)
	expect(res.materializedState).toHaveLength(28);
});
