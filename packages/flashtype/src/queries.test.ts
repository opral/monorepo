import { describe, test, expect } from "vitest";
import { openLix, createCheckpoint } from "@lix-js/sdk";
import { plugin as mdPlugin } from "../../lix/plugin-md/dist";
import { selectFiles, selectWorkingDiffCount } from "@/queries";

describe("selectFiles", () => {
	test("returns minimal rows sorted by path", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });

		await lix.db
			.insertInto("file")
			.values([
				{ id: "f2", path: "/b.md", data: new Uint8Array() },
				{ id: "f1", path: "/a.md", data: new Uint8Array() },
			])
			.execute();

		const rows = await selectFiles(lix).execute();

		// Sorted ascending by path
		expect(rows.map((r) => r.path)).toEqual(["/a.md", "/b.md"]);
		// Minimal shape
		expect(rows[0]).toHaveProperty("id");
		expect(rows[0]).toHaveProperty("path");
	});
});

describe("selectWorkingDiff", () => {
	test("scopes change count to active file and responds to edits/checkpoints", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });

		const fileA = "file_A";
		const fileB = "file_B";

		// Seed two files
		await lix.db
			.insertInto("file")
			.values({ id: fileA, path: "/a.md", data: new TextEncoder().encode("A") })
			.execute();
		await lix.db
			.insertInto("file")
			.values({ id: fileB, path: "/b.md", data: new TextEncoder().encode("B") })
			.execute();

		// Set active file to A and checkpoint initial inserts
		await lix.db
			.insertInto("key_value")
			.values({ key: "flashtype_active_file_id", value: fileA })
			.execute();
		await createCheckpoint({ lix });

		// Make a change in A
		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode("A change") })
			.where("id", "=", fileA)
			.execute();

		// selectWorkingDiff should return >0 for active file A
		const diffA1 = await selectWorkingDiffCount(lix).executeTakeFirst();
		expect(diffA1?.total ?? 0).toBeGreaterThan(0);

		// Make an additional change in B but keep active file = A
		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode("B change") })
			.where("id", "=", fileB)
			.execute();

		// Still scoped to A → count should remain the same as only A's changes are counted
		const diffA2 = await selectWorkingDiffCount(lix).executeTakeFirst();
		expect(diffA2?.total ?? 0).toBe(diffA1?.total ?? 0);

		// Switch active file to B
		await lix.db
			.updateTable("key_value")
			.set({ value: fileB })
			.where("key", "=", "flashtype_active_file_id")
			.execute();

		const diffB = await selectWorkingDiffCount(lix).executeTakeFirst();
		expect(diffB?.total ?? 0).toBeGreaterThan(0);

		// Checkpoint and expect zero for B
		await createCheckpoint({ lix });
		const diffBAfter = await selectWorkingDiffCount(lix).executeTakeFirst();
		expect(diffBAfter?.total ?? 0).toBe(0);
	});
});
