import { expect, test } from "vitest";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { fileQueueSettled } from "./file-queue-settled.js";
import { withSkipFileQueue } from "./with-skip-file-queue.js";

test("skipping the file queue should be possible", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectChangesGlob: "*",
		detectChanges: async ({ after }) => {
			const textAfter = after
				? new TextDecoder().decode(after.data)
				: undefined;
			return [
				{
					schema: {
						key: "text",
						type: "json",
					},
					entity_id: "test",
					snapshot: { text: textAfter },
				},
			];
		},
	};

	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({
			id: "test",
			data: new TextEncoder().encode("update0"),
			path: "/test.txt",
		})
		.execute();

	await fileQueueSettled({ lix });

	const changes0 = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "text")
		.selectAll()
		.execute();

	expect(changes0).toHaveLength(1);
	expect(changes0[0]?.content).toEqual({ text: "update0" });

	await withSkipFileQueue(lix.db, async (trx) => {
		await trx
			.updateTable("file")
			.set({
				data: new TextEncoder().encode("update1"),
			})
			.where("id", "=", "test")
			.execute();
	});

	await fileQueueSettled({ lix });

	const changes1 = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll()
		.where("schema_key", "=", "text")
		.execute();

	// change is skipped, so no new change is created
	expect(changes1).toHaveLength(1);
	expect(changes1[0]?.content).toEqual({ text: "update0" });
});

test("skipping the file queue should be possible with multiple changes and supports nesting", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectChangesGlob: "*",
		detectChanges: async ({ after }) => {
			const textAfter = after
				? new TextDecoder().decode(after.data)
				: undefined;
			return [
				{
					schema: {
						key: "text",
						type: "json",
					},
					entity_id: "test",
					snapshot: { text: textAfter },
				},
			];
		},
	};

	const lix = await openLixInMemory({
		providePlugins: [mockPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({
			id: "test",
			data: new TextEncoder().encode("initial"),
			path: "/test.txt",
		})
		.execute();

	const manyUpdates = Array.from({ length: 100 }, (_, i) => `update${i}`);

	const first50Updates = manyUpdates.slice(0, 50);
	const last50Updates = manyUpdates.slice(50);

	await lix.db.transaction().execute(async (trx) => {
		for (const update of first50Updates) {
			await trx
				.updateTable("file")
				.set({
					data: new TextEncoder().encode(update),
				})
				.where("id", "=", "test")
				.execute();
		}
		// Test nesting by using two levels of withSkipFileQueue
		await withSkipFileQueue(trx, async (outerTrx) => {
			for (const update of last50Updates) {
				await withSkipFileQueue(outerTrx, async (innerTrx) => {
					await innerTrx
						.updateTable("file")
						.set({
							data: new TextEncoder().encode(update),
						})
						.where("id", "=", "test")
						.execute();
				});
			}
		});
	});

	await fileQueueSettled({ lix });

	const file = await lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", "test")
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("file_id", "=", file.id)
		.selectAll()
		.execute();

	// expecting the latest change
	expect(file.data).toEqual(new TextEncoder().encode("update99"));
	// and only 50 changes + 1 insert change have been created
	expect(changes).toHaveLength(51);
});

test("it logs when skipping the file queue", async () => {
	const lix = await openLixInMemory({
		keyValues: [{ key: "lix_log_levels", value: JSON.stringify(["debug"]) }],
	});

	await withSkipFileQueue(lix.db, async () => {
		// Do something
	});

	const logs = await lix.db
		.selectFrom("log")
		.where("key", "=", "lix.file_queue.skipped")
		.selectAll()
		.execute();

	expect(logs).toHaveLength(1);
	expect(logs[0]?.key).toBe("lix.file_queue.skipped");
	expect(logs[0]?.level).toBe("debug");
	expect(logs[0]?.message).toBe("The file queue has been skipped.");
});
