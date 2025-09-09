import { describe, test, expect } from "vitest";
import { openLix } from "./open-lix.js";
import { openLixBackend } from "./open-lix-backend.js";
import { InMemory } from "../backend/main-thread.js";

async function runKeyValueSequence(db: any) {
	const out: any[] = [];

	await db.transaction().execute(async (trx: any) => {
		// Insert
		const ins = trx
			.insertInto("key_value")
			.values({ key: "parity_key", value: "one" });
		await ins.execute();
		const afterInsert = await trx
			.selectFrom("key_value")
			.selectAll()
			.where("key", "=", "parity_key")
			.executeTakeFirst();
		out.push({ stage: "insert", row: afterInsert });

		// Update
		await trx
			.updateTable("key_value")
			.set({ value: "two" })
			.where("key", "=", "parity_key")
			.execute();
		const afterUpdate = await trx
			.selectFrom("key_value")
			.selectAll()
			.where("key", "=", "parity_key")
			.executeTakeFirst();
		out.push({ stage: "update", row: afterUpdate });

		// Delete
		await trx.deleteFrom("key_value").where("key", "=", "parity_key").execute();
		const afterDelete = await trx
			.selectFrom("key_value")
			.selectAll()
			.where("key", "=", "parity_key")
			.executeTakeFirst();
		out.push({ stage: "delete", row: afterDelete ?? null });
	});

	return out;
}

describe("openLix vs openLixBackend parity (key_value)", () => {
	test("insert, update, delete behave identically", async () => {
		// Classic openLix (main-thread in-memory storage)
		const classic = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Backend-based (in-memory backend, runtime booted)
		const backend = InMemory();
		const hosted = await openLixBackend({
			backend,
			pluginsRaw: [],
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

		try {
			const a = await runKeyValueSequence(classic.db);
			const b = await runKeyValueSequence(hosted.db);

			// Normalize rows to a minimal comparable shape
			const normalize = (rows: any[]) =>
				rows.map((x) =>
					x.row
						? {
								stage: x.stage,
								key: x.row.key,
								value: x.row.value,
							}
						: { stage: x.stage, key: null, value: null }
				);

			expect(normalize(a)).toEqual(normalize(b));
		} finally {
			await classic.close();
			await hosted.close();
		}
	});
});
