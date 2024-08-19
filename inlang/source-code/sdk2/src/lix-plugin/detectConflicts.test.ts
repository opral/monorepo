/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect } from "vitest";
import { inlangLixPluginV1 } from "./inlangLixPluginV1.js";
import { newLixFile, openLixInMemory, type Change } from "@lix-js/sdk";

test("a create operation should not report a conflict given that the change does not exist in target", async () => {
	const targetLix = await openLixInMemory({ blob: await newLixFile() });
	const sourceLix = await openLixInMemory({ blob: await newLixFile() });
	const change: Change = {
		id: "1",
		parent_id: undefined,
		operation: "create",
		file_id: "mock",
		plugin_key: "mock",
		type: "mock",
		// @ts-expect-error  - type error in lix
		value: JSON.stringify(["change 1"]),
	};
	await sourceLix.db.insertInto("change").values([change]).execute();
	const conflicts = await inlangLixPluginV1.detectConflicts!({
		sourceLix,
		targetLix,
	});
	expect(conflicts).toHaveLength(0);
});

test.todo(
	"it should report deletions as a conflict if the parent of the target and source are not identical",
	async () => {
		const targetLix = await openLixInMemory({ blob: await newLixFile() });
		await targetLix.db
			.insertInto("change")
			.values([
				{
					id: "1",
					parent_id: undefined,
					operation: "create",
					file_id: "mock",
					plugin_key: "mock",
					type: "mock",
					// @ts-expect-error  - type error in lix
					value: JSON.stringify(["change 1"]),
				},
			])
			.execute();

		const sourceLix = await openLixInMemory({ blob: await targetLix.toBlob() });

		const changesNotInTarget: Change[] = [
			{
				id: "2",
				parent_id: "1",
				operation: "delete",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
				value: undefined,
			},
		];

		await sourceLix.db
			.insertInto("change")
			.values(changesNotInTarget)
			.execute();

		const conflicts = await inlangLixPluginV1.detectConflicts!({
			sourceLix,
			targetLix,
		});
		expect(conflicts).toHaveLength(1);
		expect(conflicts[0]?.change_id).toBe("1");
		expect(conflicts[0]?.conflicting_change_id).toBe("2");
		throw new Error("The parent is identicak, fix this test");
	}
);

test.todo(
	"it should report an UPDATE as a conflict (until more sophisticated reasoning is added)",
	async () => {
		const targetLix = await openLixInMemory({ blob: await newLixFile() });
		const sourceLix = await openLixInMemory({ blob: await targetLix.toBlob() });

		const commonChanges: Change[] = [
			{
				id: "12s",
				parent_id: undefined,
				operation: "create",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
				// @ts-expect-error  - type error in lix
				value: JSON.stringify(["change 12s"]),
			},
		];

		const changesOnlyInTarget: Change[] = [
			{
				id: "3sd",
				parent_id: "12s",
				operation: "update",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
				// @ts-expect-error  - type error in lix
				value: JSON.stringify(["change 3sd"]),
			},
		];

		const changesOnlyInSource: Change[] = [
			{
				id: "2qa",
				parent_id: "12s",
				operation: "update",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
				// @ts-expect-error  - type error in lix
				value: JSON.stringify(["change 2qa"]),
			},
		];

		await sourceLix.db
			.insertInto("change")
			.values([...commonChanges, ...changesOnlyInSource])
			.execute();

		await targetLix.db
			.insertInto("change")
			.values([...commonChanges, ...changesOnlyInTarget])
			.execute();

		// const conflict = await inlangLixPluginV1.reportConflicts!({
	}
);

test("it should NOT report a DELETE as a conflict if the parent of the target and source are identical", async () => {
	const targetLix = await openLixInMemory({ blob: await newLixFile() });
	await targetLix.db
		.insertInto("change")
		.values([
			{
				id: "12s",
				parent_id: undefined,
				operation: "create",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
				// @ts-expect-error  - type error in lix
				value: JSON.stringify(["change 12s"]),
			},
		])
		.execute();

	const sourceLix = await openLixInMemory({ blob: await targetLix.toBlob() });

	const changesNotInTarget: Change[] = [
		{
			id: "3sd",
			parent_id: "12s",
			operation: "delete",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			value: undefined,
		},
	];

	const changesNotInSource: Change[] = [
		{
			id: "2qa",
			parent_id: "12s",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error  - type error in lix
			value: JSON.stringify(["change 2qa"]),
		},
	];

	await sourceLix.db.insertInto("change").values(changesNotInTarget).execute();

	await targetLix.db.insertInto("change").values(changesNotInSource).execute();

	const conflicts = await inlangLixPluginV1.detectConflicts!({
		sourceLix,
		targetLix,
	});

	expect(conflicts).toHaveLength(1);
	expect(conflicts[0]?.change_id).toBe("2qa");
	expect(conflicts[0]?.conflicting_change_id).toBe("3sd");
});
