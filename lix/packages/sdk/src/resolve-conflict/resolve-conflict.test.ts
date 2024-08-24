/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import { resolveConflict } from "./resolve-conflict.js";
import type { Change } from "../schema.js";
import type { LixPlugin } from "../plugin.js";

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

test.todo(
	"resolving a conflict should throw if the change to resolve with is not a direct child of the conflicting changes",
);

test.todo(
	"resolving a conflict should throw if the change to resolve with does not belong to the same file as the conflicting changes",
);

test.todo(
	"resolving a conflict should throw if the plugin does not support applying changes",
);

test.todo("resolving a conflict should throw if the file does not exist");

test.todo(
	"resolving a conflict with multiple conflicting changes should resolve all conflicts",
);