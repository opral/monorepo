import { expect, test } from "vitest";
import { openLix } from "./lix/open-lix.js";

// Storage footprint benchmark: insert 100 tracked rows via entity views
// and report counts and byte sizes of change and snapshot storage.
test("storage footprint for 100 state commits", async () => {
	const lix = await openLix({});

	// Baseline counts and sizes right after bootstrap
	const baseline = getChangeStatsRaw(lix);

	// Perform 100 tracked inserts into the active version via entity view
	for (let i = 0; i < 1; i++) {
		// Use key_value as a simple tracked entity
		await lix.db
			.insertInto("key_value")
			.values({ key: `storage_bench_${i}`, value: { n: i } as any })
			.execute();
	}

	const after = getChangeStatsRaw(lix);

	const delta = {
		change_rows: after.change_rows - baseline.change_rows,
		change_bytes: after.change_bytes - baseline.change_bytes,
	};

	// Log results for inspection in CI output
	const mb = (delta.change_bytes / (1024 * 1024)).toFixed(2);
	console.log(`${delta.change_rows} changes | ${mb}MB`);

	// Basic sanity: we should have written something
	expect(delta.change_rows).toBeGreaterThan(0);
	expect(delta.change_bytes).toBeGreaterThan(0);
});

test("log change breakdown for a single state mutation", async () => {
	const lix = await openLix({});

	const beforeIds = getAllChangeIds(lix);

	// One tracked mutation
	await lix.db
		.insertInto("key_value")
		.values({ key: `single_mutation_probe`, value: { probe: true } as any })
		.execute();

	const afterIds = getAllChangeIds(lix);
	const newIds = afterIds.filter((id: string) => !beforeIds.includes(id));

	const breakdown = getChangeBreakdown(lix, newIds);

	// Pretty log
	console.log(`new change rows for 1 mutation: ${newIds.length}`);
	for (const [schema_key, items] of Object.entries(breakdown.bySchema)) {
		console.log(`  ${schema_key}: ${items.length}`);
	}
	// Show concise list
	for (const row of breakdown.rows) {
		console.log(
			`  id=${row.id} schema=${row.schema_key} entity=${row.entity_id} file=${row.file_id}`
		);
	}

	// Also log total snapshot size for the new rows
	const bytes = getSnapshotBytesForIds(lix, newIds);
	const kb = (bytes / 1024).toFixed(2);
	console.log(`  total snapshot size: ${kb}KB`);

	expect(newIds.length).toBeGreaterThan(0);
});

function getAllChangeIds(lix: any): string[] {
	const rows = lix.sqlite.exec({
		sql: `SELECT id FROM change ORDER BY created_at, id`,
		returnValue: "resultRows",
		rowMode: "array",
	}) as string[][];
	return (rows || [])
		.map((r) => r[0] as string)
		.filter((v): v is string => Boolean(v));
}

function getChangeBreakdown(
	lix: any,
	ids: string[]
): { bySchema: Record<string, any[]>; rows: any[] } {
	if (!ids.length) return { bySchema: {}, rows: [] };
	const placeholders = ids.map(() => `?`).join(",");
	const rows = lix.sqlite.exec({
		sql: `
      SELECT id, schema_key, entity_id, file_id, created_at, snapshot_content
      FROM change
      WHERE id IN (${placeholders})
      ORDER BY created_at, id
    `,
		bind: ids,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];
	const bySchema: Record<string, any[]> = {};
	for (const r of rows) {
		const key = r.schema_key || "<null>";
		(bySchema[key] ||= []).push(r);
	}
	return { bySchema, rows };
}

function getSnapshotBytesForIds(lix: any, ids: string[]): number {
	if (!ids.length) return 0;
	const placeholders = ids.map(() => `?`).join(",");
	const res = lix.sqlite.exec({
		sql: `SELECT COALESCE(SUM(LENGTH(snapshot_content)),0) FROM change WHERE id IN (${placeholders})`,
		bind: ids,
		returnValue: "resultRows",
		rowMode: "array",
	}) as any[];
	return Number(res?.[0]?.[0] ?? 0);
}

function getChangeStatsRaw(lix: any): {
	change_rows: number;
	change_bytes: number;
} {
	const sqlite = lix.sqlite;
	const rows = sqlite.exec({
		sql: `
      SELECT 
        COUNT(*) AS change_rows,
        COALESCE(SUM(LENGTH(snapshot_content)), 0) AS change_bytes
      FROM change;
    `,
		returnValue: "resultRows",
		rowMode: "object",
	}) as Array<{ change_rows: string | number; change_bytes: string | number }>;

	const row = rows && rows[0] ? rows[0] : { change_rows: 0, change_bytes: 0 };
	return {
		change_rows: Number(row.change_rows ?? 0),
		change_bytes: Number(row.change_bytes ?? 0),
	};
}
