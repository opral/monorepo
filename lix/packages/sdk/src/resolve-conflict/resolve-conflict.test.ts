/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import { resolveConflict } from "./resolve-conflict.js";
import type { Change } from "../schema.js";
import type { LixPlugin } from "../plugin.js";
import {
	ChangeDoesNotBelongToFileError,
	ChangeHasBeenMutatedError,
	ChangeNotDirectChildOfConflictError,
} from "./errors.js";

test("it should resolve a conflict by applying the change and mark the conflict as resolved with the applied change", async () => {
	const mockChanges: Change[] = [
		{
			id: "change1",
			operation: "create",
			plugin_key: "plugin1",
			type: "mock",
			file_id: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value1",
			}),
		},
		{
			id: "change2",
			operation: "create",
			plugin_key: "plugin1",
			file_id: "mock",
			type: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value2",
			}),
		},
	];

	const mockPlugin: LixPlugin = {
		key: "plugin1",
		glob: "*",
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode(
				mockChanges[0]?.value as unknown as string,
			),
		}),
		diff: {
			file: vi.fn(),
		},
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

	await resolveConflict({
		lix: lix,
		conflict: conflict,
		resolveWithChange: changes[0]!,
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

	const parsed = new TextDecoder().decode(fileAfterResolve.data);

	expect(parsed).toBe(mockChanges[0]!.value);
	expect(resolvedConflict.resolved_with_change_id).toBe(changes[0]!.id);
});

test("it should throw if the to be resolved with change already exists in the database but is not equal (change immutability is violated)", async () => {
	const mockChanges: Change[] = [
		{
			id: "change1",
			operation: "create",
			plugin_key: "plugin1",
			type: "mock",
			file_id: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value1",
			}),
		},
		{
			id: "change2",
			operation: "create",
			file_id: "mock",
			plugin_key: "plugin1",
			type: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value2",
			}),
		},
	];

	const mockPlugin: LixPlugin = {
		key: "plugin1",
		glob: "*",
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode(
				mockChanges[0]?.value as unknown as string,
			),
		}),
		diff: {
			file: vi.fn(),
		},
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
		resolveConflict({
			lix: lix,
			conflict: conflict,
			resolveWithChange: {
				...changes[0]!,
				// @ts-expect-error - manual stringification
				value: JSON.stringify({
					key: "mutated-value",
				}),
			},
		}),
	).rejects.toThrowError(new ChangeHasBeenMutatedError());
});

// the sequence of changes will be broken otherwise
test("resolving a conflict should throw if the to be resolved with change is not a direct child of the conflicting changes", async () => {
	const mockChanges: Change[] = [
		{
			id: "change1",
			operation: "create",
			plugin_key: "plugin1",
			type: "mock",
			file_id: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value1",
			}),
		},
		{
			id: "change2",
			operation: "create",
			file_id: "mock",
			plugin_key: "plugin1",
			type: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value2",
			}),
		},
	];

	const mockPlugin: LixPlugin = {
		key: "plugin1",
		glob: "*",
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode(
				mockChanges[0]?.value as unknown as string,
			),
		}),
		diff: {
			file: vi.fn(),
		},
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
		resolveConflict({
			lix: lix,
			conflict: conflict,
			resolveWithChange: {
				id: "new-change-3",
				operation: "create",
				file_id: "mock",
				parent_id: undefined,
				plugin_key: "plugin1",
				type: "mock",
				// @ts-expect-error - manual stringification
				value: JSON.stringify({
					key: "value3",
				}),
			},
		}),
	).rejects.toThrowError(new ChangeNotDirectChildOfConflictError());
});

// the sequence of changes will be broken otherwise
test("resolving a conflict should throw if the change to resolve with does not belong to the same file as the conflicting changes", async () => {
	const mockChanges: Change[] = [
		{
			id: "change1",
			operation: "create",
			plugin_key: "plugin1",
			type: "mock",
			file_id: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value1",
			}),
		},
		{
			id: "change2",
			operation: "create",
			file_id: "mock",
			plugin_key: "plugin1",
			type: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value2",
			}),
		},
	];

	const mockPlugin: LixPlugin = {
		key: "plugin1",
		glob: "*",
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode(
				mockChanges[0]?.value as unknown as string,
			),
		}),
		diff: {
			file: vi.fn(),
		},
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
		resolveConflict({
			lix: lix,
			conflict: conflict,
			resolveWithChange: {
				id: "new-change-3",
				operation: "create",
				file_id: "other-mock-file",
				parent_id: changes[0]!.id,
				plugin_key: "plugin1",
				type: "mock",
				// @ts-expect-error - manual stringification
				value: JSON.stringify({
					key: "value3",
				}),
			},
		}),
	).rejects.toThrowError(new ChangeDoesNotBelongToFileError());
});

test("resolving a conflict with a new change (likely the result of a merge resolution) should insert the change and mark the conflict as resolved with the new change", async () => {
	const mockChanges: Change[] = [
		{
			id: "change1",
			operation: "create",
			plugin_key: "plugin1",
			type: "mock",
			file_id: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value1",
			}),
		},
		{
			id: "change2",
			operation: "create",
			file_id: "mock",
			plugin_key: "plugin1",
			type: "mock",
			// @ts-expect-error - manual stringification
			value: JSON.stringify({
				key: "value2",
			}),
		},
	];

	const mockPlugin: LixPlugin = {
		key: "plugin1",
		glob: "*",
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode('{"key":"value3"}'),
		}),
		diff: {
			file: vi.fn(),
		},
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

	await resolveConflict({
		lix: lix,
		conflict: conflict,
		resolveWithChange: {
			id: "new-change-3",
			operation: "create",
			file_id: "mock",
			parent_id: changes[0]!.id,
			plugin_key: "plugin1",
			type: "mock",
			value: {
				// @ts-expect-error - manual stringification
				key: "value3",
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
		.selectAll()
		.execute();

	expect(changesAfterResolve.length).toBe(3);
	expect(resolvedConflict.resolved_with_change_id).toBe(
		changesAfterResolve[2]?.id,
	);
	expect(changesAfterResolve[2]!.value).toStrictEqual({
		key: "value3",
	});
	expect(new TextDecoder().decode(fileAfterResolve.data)).toBe(
		'{"key":"value3"}',
	);
});
