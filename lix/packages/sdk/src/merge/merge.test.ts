/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import { merge } from "./merge.js";
import type { Change, Commit, Conflict } from "../schema.js";
import type { LixPlugin } from "../plugin.js";

test("it should copy changes from the source into the target that do not exist in target yet", async () => {
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

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
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
	expect(mockPlugin.detectConflicts).toHaveBeenCalledTimes(1);
});

test("it should save change conflicts", async () => {
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

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([
			{
				change_id: mockChanges[1]!.id,
				conflicting_change_id: mockChanges[2]!.id,
			} satisfies Conflict,
		]),
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

test("diffing should not be invoked to prevent the generation of duplicate changes", async () => {
	const commonChanges: Change[] = [
		{
			id: "1",
			operation: "create",
			type: "mock",
			// @ts-expect-error - expects serialized json
			value: JSON.stringify({ id: "mock-id", color: "red" }),
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const changesOnlyInTarget: Change[] = [];
	const changesOnlyInSource: Change[] = [
		{
			id: "2",
			operation: "update",
			type: "mock",
			// @ts-expect-error - expects serialized json
			value: JSON.stringify({ id: "mock-id", color: "blue" }),
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPluginInSource: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const mockPluginInTarget: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const source = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPluginInSource],
	});

	const target = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPluginInTarget],
	});

	await source.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInSource])
		.execute();

	await target.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTarget])
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

	expect(mockPluginInSource.diff.file).toHaveBeenCalledTimes(0);
	// once for the mock file insert
	expect(mockPluginInTarget.diff.file).toHaveBeenCalledTimes(1);
});

test("it should apply changes that are not conflicting", async () => {
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

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
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

test("subsequent merges should not lead to duplicate changes and/or conflicts", async () => {
	const commonChanges: Change[] = [
		{
			id: "1",
			operation: "create",
			type: "mock",
			// @ts-expect-error - expects serialized json
			value: JSON.stringify({ id: "mock-id", color: "red" }),
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];
	const changesOnlyInTarget: Change[] = [];
	const changesOnlyInSource: Change[] = [
		{
			id: "2",
			operation: "update",
			type: "mock",
			// @ts-expect-error - expects serialized json
			value: JSON.stringify({ id: "mock-id", color: "blue" }),
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([
			{
				change_id: commonChanges[0]!.id,
				conflicting_change_id: changesOnlyInSource[0]!.id,
			} satisfies Conflict,
		]),
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
		.values([...commonChanges, ...changesOnlyInSource])
		.execute();

	await target.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTarget])
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

	const changes = await target.db.selectFrom("change").selectAll().execute();

	const conflicts = await target.db
		.selectFrom("conflict")
		.selectAll()
		.execute();

	expect(changes.length).toBe(2);
	expect(conflicts.length).toBe(1);

	await merge({ source, target });

	const changesAfterSecondMerge = await target.db
		.selectFrom("change")
		.selectAll()
		.execute();

	const conflictsAfterSecondMerge = await target.db
		.selectFrom("conflict")
		.selectAll()
		.execute();

	expect(changesAfterSecondMerge.length).toBe(2);
	expect(conflictsAfterSecondMerge.length).toBe(1);
});

test("it should naively copy changes from the source into the target that do not exist in target yet", async () => {
	const changesOnlyInSource: Change[] = [
		{
			id: "2",
			operation: "update",
			commit_id: "commit-1",
			type: "mock",
			// @ts-expect-error - expects serialized json
			value: JSON.stringify({ id: "mock-id", color: "blue" }),
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const commitsOnlyInSource: Commit[] = [
		{
			id: "commit-1",
			description: "",
			parent_id: "0",
			user_id: "",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
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

	await target.db
		.insertInto("file")
		.values({ id: "mock-file", path: "", data: new Uint8Array() })
		.execute();

	await source.db.insertInto("change").values(changesOnlyInSource).execute();

	await source.db.insertInto("commit").values(commitsOnlyInSource).execute();

	await merge({ source, target });

	const changes = await target.db.selectFrom("change").selectAll().execute();
	const commits = await target.db.selectFrom("commit").selectAll().execute();

	expect(changes.length).toBe(1);
	expect(commits.length).toBe(1);
	expect(changes[0]?.commit_id).toBe("commit-1");
});