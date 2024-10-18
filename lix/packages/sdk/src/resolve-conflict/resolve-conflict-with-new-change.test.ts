import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import { resolveConflictWithNewChange } from "./resolve-conflict-with-new-change.js";
import type { NewChange, Snapshot } from "../database/schema.js";
import type { LixPlugin } from "../plugin.js";
import {
	ChangeAlreadyExistsError,
	ChangeDoesNotBelongToFileError,
	ChangeNotDirectChildOfConflictError,
} from "./errors.js";
import { createPhantomSnapshot } from "../query-utilities/create-phantom-snapshot.js";

test("it should throw if the to be resolved with change already exists", async () => {
	const mockSnapshots: Snapshot[] = [
		createPhantomSnapshot({
			id: "value1",
		}),
		createPhantomSnapshot({
			id: "value2",
		}),
	];

	const mockChanges: NewChange[] = [
		{
			plugin_key: "plugin1",
			type: "mock",
			file_id: "mock",
			snapshot_id: mockSnapshots[0]!.id,
			entity_id: "value1",
		},
		{
			file_id: "mock",
			entity_id: "value2",
			plugin_key: "plugin1",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
		},
	];

	const mockPlugin: LixPlugin = {
		key: "plugin1",
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode(
				JSON.stringify(mockSnapshots[0]?.content),
			),
		}),
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({ id: "mock", path: "mock", data: new Uint8Array() })
		.execute();

	await lix.db
		.insertInto("snapshot")
		.values(
			mockSnapshots.map((s) => {
				return { content: s.content };
			}),
		)
		.returningAll()
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	const conflict = await lix.db
		.insertInto("conflict")
		.values({
			change_id: changes[0]!.id,
			conflicting_change_id: changes[1]!.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await expect(
		resolveConflictWithNewChange({
			lix: lix,
			conflict: conflict,
			newChange: {
				...changes[0]!,
				parent_id: changes[0]!.id,
				content: mockSnapshots[0]?.content,
			},
		}),
	).rejects.toThrowError(ChangeAlreadyExistsError);
});

// the sequence of changes will be broken otherwise
test("resolving a conflict should throw if the to be resolved with change is not a direct child of the conflicting changes", async () => {
	const mockSnapshots: Snapshot[] = [
		createPhantomSnapshot({
			id: "value1",
		}),
		createPhantomSnapshot({
			id: "value2",
		}),
	];

	const mockChanges: NewChange[] = [
		{
			plugin_key: "plugin1",
			entity_id: "value1",
			type: "mock",
			file_id: "mock",
			snapshot_id: mockSnapshots[0]!.id,
		},
		{
			file_id: "mock",
			entity_id: "value2",
			plugin_key: "plugin1",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
		},
	];

	const mockPlugin: LixPlugin = {
		key: "plugin1",
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode(
				JSON.stringify(mockSnapshots[0]?.content),
			),
		}),
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({ id: "mock", path: "mock", data: new Uint8Array() })
		.execute();

	await lix.db
		.insertInto("snapshot")
		.values(
			mockSnapshots.map((s) => {
				return { content: s.content };
			}),
		)
		.returningAll()
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	const conflict = await lix.db
		.insertInto("conflict")
		.values({
			change_id: changes[0]!.id,
			conflicting_change_id: changes[1]!.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await expect(
		resolveConflictWithNewChange({
			lix: lix,
			conflict: conflict,
			newChange: {
				author: undefined,
				file_id: "mock",
				parent_id: null,
				plugin_key: "plugin1",
				type: "mock",
				entity_id: "value3",
				content: {
					id: "value3",
				},
			},
		}),
	).rejects.toThrowError(ChangeNotDirectChildOfConflictError);
});

// the sequence of changes will be broken otherwise
test("resolving a conflict should throw if the change to resolve with does not belong to the same file as the conflicting changes", async () => {
	const mockSnapshots: Snapshot[] = [
		createPhantomSnapshot({
			id: "value1",
		}),
		createPhantomSnapshot({
			id: "value2",
		}),
	];

	const mockChanges: NewChange[] = [
		{
			plugin_key: "plugin1",
			type: "mock",
			entity_id: "value1",
			file_id: "mock",
			snapshot_id: mockSnapshots[0]!.id,
		},
		{
			file_id: "mock",
			entity_id: "value2",
			plugin_key: "plugin1",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
		},
	];
	const mockPlugin: LixPlugin = {
		key: "plugin1",
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode(
				JSON.stringify(mockSnapshots[0]?.content),
			),
		}),
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({ id: "mock", path: "mock", data: new Uint8Array() })
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	const conflict = await lix.db
		.insertInto("conflict")
		.values({
			change_id: changes[0]!.id,
			conflicting_change_id: changes[1]!.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await expect(
		resolveConflictWithNewChange({
			lix: lix,
			conflict: conflict,
			newChange: {
				file_id: "other-mock-file",
				parent_id: changes[0]!.id,
				plugin_key: "plugin1",
				type: "mock",
				entity_id: "value3",
				content: {
					id: "value3",
				},
			},
		}),
	).rejects.toThrowError(ChangeDoesNotBelongToFileError);
});

test("resolving a conflict with a new change should insert the change and mark the conflict as resolved with the new change", async () => {
	const mockSnapshots: Snapshot[] = [
		createPhantomSnapshot({
			id: "value1",
		}),
		createPhantomSnapshot({
			id: "value2",
		}),
	];

	const mockChanges: NewChange[] = [
		{
			plugin_key: "plugin1",
			entity_id: "value1",
			type: "mock",
			file_id: "mock",
			snapshot_id: mockSnapshots[0]!.id,
		},
		{
			file_id: "mock",
			entity_id: "value2",
			plugin_key: "plugin1",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
		},
	];

	const mockPlugin: LixPlugin = {
		key: "plugin1",
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode('{"id":"value3"}'),
		}),
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({ id: "mock", path: "mock", data: new Uint8Array() })
		.execute();

	await lix.db
		.insertInto("snapshot")
		.values(
			mockSnapshots.map((s) => {
				return { content: s.content };
			}),
		)
		.returningAll()
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	const conflict = await lix.db
		.insertInto("conflict")
		.values({
			change_id: changes[0]!.id,
			conflicting_change_id: changes[1]!.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await resolveConflictWithNewChange({
		lix: lix,
		conflict: conflict,
		newChange: {
			file_id: "mock",
			parent_id: changes[0]!.id,
			plugin_key: "plugin1",
			entity_id: "value3",
			type: "mock",
			content: {
				id: "value3",
			},
		},
	});

	const resolvedConflict = await lix.db
		.selectFrom("conflict")
		.selectAll()
		.where("change_id", "=", conflict.change_id)
		.where("conflicting_change_id", "=", conflict.conflicting_change_id)
		.executeTakeFirstOrThrow();

	const fileAfterResolve = await lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", changes[0]!.file_id)
		.executeTakeFirstOrThrow();

	const changesAfterResolve = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	expect(changesAfterResolve.length).toBe(3);
	expect(resolvedConflict.resolved_change_id).toBe(changesAfterResolve[2]?.id);
	expect(changesAfterResolve[2]!.content).toStrictEqual({
		id: "value3",
	});
	expect(new TextDecoder().decode(fileAfterResolve.data)).toBe(
		'{"id":"value3"}',
	);
});
