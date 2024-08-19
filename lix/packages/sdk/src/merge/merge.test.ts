/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import { merge } from "./merge.js";
import type { Change, Conflict } from "../schema.js";
import type { LixPlugin } from "../plugin.js";

test("it should copy changes from the source into the target that do not exist in target yet", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue(undefined),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const source = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const target = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await source.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!, mockChanges[2]!])
		.execute();

	await target.db.insertInto("change").values([mockChanges[0]!]).execute();

	await target.db
		.insertInto("file")
		.values({
			id: "mock-file",
			path: "/mock-file.json",
			data: new TextEncoder().encode(JSON.stringify({})),
		})
		.execute();

	await merge({ source, target });

	const changes = await target.db.selectFrom("change").select("id").execute();

	expect(changes.map((c) => c.id)).toStrictEqual([
		mockChanges[0]?.id,
		mockChanges[1]?.id,
		mockChanges[2]?.id,
	]);

	expect(mockPlugin.applyChanges).toHaveBeenCalledTimes(1);
	expect(mockPlugin.detectConflicts).toHaveBeenCalledTimes(2);
});

test("it should save change conflicts", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi
			.fn()
			.mockResolvedValue(undefined)
			.mockResolvedValueOnce({
				change_id: mockChanges[1]!.id,
				conflicting_change_id: mockChanges[2]!.id,
			} satisfies Conflict),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const source = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const target = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await source.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[2]!])
		.execute();

	await target.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.execute();

	await target.db
		.insertInto("file")
		.values({
			id: "mock-file",
			path: "/mock-file.json",
			data: new TextEncoder().encode(JSON.stringify({})),
		})
		.execute();

	await merge({ source, target });

	const conflicts = await target.db
		.selectFrom("conflict")
		.select(["change_id", "conflicting_change_id"])
		.execute();

	expect(conflicts.length).toBe(1);
	expect(conflicts[0]).toEqual({
		change_id: mockChanges[1]!.id,
		conflicting_change_id: mockChanges[2]!.id,
	});
});

test("it should apply changes that are not conflicting", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue(undefined),
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode(
				// @ts-expect-error - expects parsed json
				mockChanges[1]!.value,
			),
		}),
	};

	const source = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const target = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await source.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.execute();

	await target.db.insertInto("change").values([mockChanges[0]!]).execute();

	await target.db
		.insertInto("file")
		.values({
			id: "mock-file",
			path: "/mock-file.json",
			data: new TextEncoder().encode(JSON.stringify({})),
		})
		.execute();

	await merge({ source, target });

	const changes = await target.db.selectFrom("change").selectAll().execute();
	const conflicts = await target.db
		.selectFrom("conflict")
		.selectAll()
		.execute();

	const file = await target.db
		.selectFrom("file")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changes.length).toBe(2);
	expect(conflicts.length).toBe(0);
	expect(file.data).toEqual(
		new TextEncoder().encode(
			// @ts-expect-error - expects parsed json
			mockChanges[1]!.value,
		),
	);
});

const mockChanges: Change[] = [
	{
		id: "1",
		operation: "create",
		type: "mock",
		// @ts-expect-error - expects serialized json
		value: JSON.stringify({ id: "mock-id", color: "red" }),
		file_id: "mock-file",
		plugin_key: "mock-plugin",
	},
	{
		id: "2",
		operation: "update",
		type: "mock",
		// @ts-expect-error - expects serialized json
		value: JSON.stringify({ id: "mock-id", color: "blue" }),
		file_id: "mock-file",
		plugin_key: "mock-plugin",
	},
	{
		id: "3",
		operation: "update",
		type: "mock",
		// @ts-expect-error - expects serialized json
		value: JSON.stringify({ id: "mock-id", color: "green" }),
		file_id: "mock-file",
		plugin_key: "mock-plugin",
	},
];
