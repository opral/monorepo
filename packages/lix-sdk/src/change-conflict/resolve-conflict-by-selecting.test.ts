import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { newLixFile } from "../lix/new-lix.js";
import type { NewChange, Snapshot } from "../database/schema.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { mockJsonSnapshot } from "../snapshot/mock-json-snapshot.js";
import { resolveChangeConflictBySelecting } from "./resolve-conflict-by-selecting.js";

test("it should resolve a conflict and apply the changes", async () => {
	const mockSnapshots: Snapshot[] = [
		mockJsonSnapshot({
			id: "value1",
		}),
		mockJsonSnapshot({
			id: "value2",
		}),
	];

	const mockChanges: NewChange[] = [
		{
			plugin_key: "plugin1",
			schema_key: "mock",
			file_id: "mock",
			entity_id: "value1",
			snapshot_id: mockSnapshots[0]!.id,
		},
		{
			plugin_key: "plugin1",
			file_id: "mock",
			entity_id: "value2",
			schema_key: "mock",
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
		.values({
			id: "mock",
			path: "mock",
			data: new Uint8Array(),
		})
		.execute();

	const snapshots = await lix.db
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

	const changeSet0 = await lix.db
		.insertInto("change_set")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const conflict = await lix.db
		.insertInto("change_conflict")
		.values({
			key: "mock",
			change_set_id: changeSet0.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await resolveChangeConflictBySelecting({
		lix: lix,
		conflict: conflict,
		select: changes[0]!,
	});

	const resolvedConflict = await lix.db
		.selectFrom("change_conflict")
		.innerJoin(
			"change_conflict_resolution",
			"change_conflict_resolution.change_conflict_id",
			"change_conflict.id",
		)
		.where("id", "=", conflict.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// TODO QUEUE check if the replacement of file_internal was expected
	const fileAfterResolve = await lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", changes[0]!.file_id)
		.executeTakeFirstOrThrow();

	const parsed = JSON.parse(new TextDecoder().decode(fileAfterResolve.data));

	expect(parsed).toStrictEqual(snapshots[0]!.content);
	expect(resolvedConflict.resolved_change_id).toBe(changes[0]!.id);
});
