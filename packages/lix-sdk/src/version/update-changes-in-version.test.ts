import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { updateChangesInVersion } from "./update-changes-in-version.js";
import { changeInVersion } from "../query-filter/change-in-version.js";
import { createVersion } from "./create-version.js";

test("the version change set should be updated", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	const version1 = await createVersion({ lix, name: "version1" });

	const changes = await lix.db
		.insertInto("change")
		.values({
			id: "change-1",
			schema_key: "file",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.execute();

	await updateChangesInVersion({
		lix,
		version: version0,
		changes,
	});

	// version 1 should remain as is
	await updateChangesInVersion({
		lix,
		version: version1,
		changes,
	});

	const version0Changes0 = await lix.db
		.selectFrom("change")
		.where(changeInVersion(version0))
		.selectAll()
		.execute();

	const version1Changes0 = await lix.db
		.selectFrom("change")
		.where(changeInVersion(version1))
		.selectAll()
		.execute();

	// the version should contain one change
	expect(version0Changes0.length).toBe(1);
	expect(version0Changes0[0]?.id).toBe("change-1");
	expect(version1Changes0.length).toBe(1);
	expect(version1Changes0[0]?.id).toBe("change-1");

	const changes2 = await lix.db
		.insertInto("change")
		.values({
			id: "change-2",
			schema_key: "file",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.execute();

	await updateChangesInVersion({
		lix,
		version: version0,
		changes: changes2,
	});

	const version0Changes1 = await lix.db
		.selectFrom("change")
		.where(changeInVersion(version0))
		.selectAll()
		.execute();

	// the head of the change is updated to change-2
	expect(version0Changes1.length).toBe(1);
	expect(version0Changes1[0]?.id).toBe("change-2");

	// adding a change with a different entity_id should add a new change set element
	const changes3 = await lix.db
		.insertInto("change")
		.values({
			id: "change-3",
			schema_key: "file",
			entity_id: "value2",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.execute();

	await updateChangesInVersion({
		lix,
		version: version0,
		changes: changes3,
	});

	const version0Changes2 = await lix.db
		.selectFrom("change")
		.where(changeInVersion(version0))
		.selectAll()
		.execute();

	const version1Changes1 = await lix.db
		.selectFrom("change")
		.where(changeInVersion(version1))
		.selectAll()
		.execute();

	// inserting a new entity should add a new change pointer
	// while not updating the old one
	expect(version0Changes2.length).toBe(2);
	expect(version0Changes2[0]?.id).toBe("change-2");
	expect(version0Changes2[1]?.id).toBe("change-3");

	// expecting that version 1 didn't update.
	expect(version1Changes0).toStrictEqual(version1Changes1);
});

// test("it should not fail if an empty array of changes is provided", async () => {
// 	const lix = await openLixInMemory({});

// 	await lix.db.transaction().execute(async (trx) => {
// 		await updateChangesInVersion({
// 			lix: { ...lix, db: trx },
// 			changes: [],
// 		});
// 	});

// 	const versionChangePointers = await lix.db
// 		.selectFrom("version_change_pointer")
// 		.selectAll()
// 		.execute();

// 	// no change pointers should be created
// 	expect(versionChangePointers.length).toBe(0);
// });

// // uncertain if behavior generalizes. might be better to have this as an opt-in automation.
// test.skip("change conflicts should be garbage collected", async () => {
// 	const lix = await openLixInMemory({});

// 	const currentversion = await lix.db
// 		.selectFrom("current_version")
// 		.selectAll()
// 		.executeTakeFirstOrThrow();

// 	await lix.db.transaction().execute(async (trx) => {
// 		const changes = await trx
// 			.insertInto("change")
// 			.values([
// 				{
// 					id: "change-1",
// 					schema_key: "file",
// 					entity_id: "value1",
// 					file_id: "mock",
// 					plugin_key: "mock-plugin",
// 					snapshot_id: "no-content",
// 				},
// 				{
// 					id: "change-2",
// 					schema_key: "file",
// 					entity_id: "value2",
// 					file_id: "mock",
// 					plugin_key: "mock-plugin",
// 					snapshot_id: "no-content",
// 				},
// 			])
// 			.returningAll()
// 			.execute();

// 		await updateChangesInVersion({
// 			lix: { ...lix, db: trx },
// 			version: currentversion,
// 			changes,
// 		});
// 	});

// 	// no version is pointing to the change conflict,
// 	// so it should be garbage collected

// 	const changeConflict = await lix.db
// 		.insertInto("change_conflict")
// 		.values({
// 			id: "change-conflict-1",
// 			key: "mock-conflict",
// 		})
// 		.returningAll()
// 		.executeTakeFirstOrThrow();

// 	await lix.db
// 		.insertInto("change_conflict_element")
// 		.values([
// 			{
// 				change_conflict_id: changeConflict.id,
// 				change_id: "change-1",
// 			},
// 			{
// 				change_conflict_id: changeConflict.id,
// 				change_id: "change-2",
// 			},
// 		])
// 		.execute();

// 	await updateChangesInVersion({
// 		lix,
// 		version: currentversion,
// 		changes: [],
// 	});

// 	const remainingChangeConflicts = await lix.db
// 		.selectFrom("change_conflict")
// 		.selectAll()
// 		.execute();

// 	// the change conflict should be garbage collected
// 	expect(remainingChangeConflicts.length).toBe(0);
// });

// // uncertain if behavior generalizes. might be better to have this as an opt-in automation.
// test.skip("it raise a diverging entity conflict (based off a reproduction)", async () => {
// 	const lix = await openLixInMemory({});

// 	const sourceversion = await lix.db
// 		.insertInto("version")
// 		.values({ name: "moles-burn" })
// 		.returningAll()
// 		.executeTakeFirstOrThrow();

// 	const targetversion = await lix.db
// 		.insertInto("version")
// 		.values({ name: "elephant" })
// 		.returningAll()
// 		.executeTakeFirstOrThrow();

// 	const mockChanges = [
// 		{
// 			created_at: "2024-11-11 21:16:34",
// 			entity_id: "email|peter.n@moon.mail|First name",
// 			file_id: "oj20a1-40ss-email",
// 			id: "b2bc8cb4-8491-4e3b-ba9e-2950f5ec4942",
// 			plugin_key: "lix-plugin-csv-v2",
// 			snapshot_id:
// 				"c1c691266638c585ddf68c90c9255741b55cc6c152919368b27d74fbc6abc402",
// 			schema_key: "cell",
// 		},
// 		{
// 			created_at: "2024-11-11 21:16:39",
// 			entity_id: "email|peter.n@moon.mail|First name",
// 			file_id: "oj20a1-40ss-email",
// 			id: "654d91f1-6139-434c-9047-9fff751ed0c4",
// 			plugin_key: "lix-plugin-csv-v2",
// 			snapshot_id:
// 				"0856f597848e8261147613b673b27b11b7d6065d8a37cef0466fa7c4444db286",
// 			schema_key: "cell",
// 		},
// 		{
// 			created_at: "2024-11-11 21:16:44",
// 			entity_id: "email|peter.n@moon.mail|First name",
// 			file_id: "oj20a1-40ss-email",
// 			id: "a4b48412-f809-49c9-83ce-77fe51831961",
// 			plugin_key: "lix-plugin-csv-v2",
// 			snapshot_id:
// 				"078a7602380806c1cca81547dc9442c550e9d5051da3b68c495b776fc85fefcb",
// 			schema_key: "cell",
// 		},
// 		{
// 			created_at: "2024-11-11 21:17:39",
// 			entity_id: "email|peter.n@moon.mail|First name",
// 			file_id: "oj20a1-40ss-email",
// 			id: "4e9fd25f-ed9c-40ae-a2ad-1a75677a2668",
// 			plugin_key: "lix-plugin-csv-v2",
// 			snapshot_id:
// 				"bf8b0881a7c85e6e16819a87e9124362b29926a30c04bd3149f5090535c671f0",
// 			schema_key: "cell",
// 		},
// 	] as const satisfies Change[];

// 	const edges = [
// 		// common ancestor is b2bc
// 		{
// 			parent_id: "b2bc8cb4-8491-4e3b-ba9e-2950f5ec4942",
// 			child_id: "654d91f1-6139-434c-9047-9fff751ed0c4",
// 		},
// 		{
// 			parent_id: "b2bc8cb4-8491-4e3b-ba9e-2950f5ec4942",
// 			child_id: "a4b48412-f809-49c9-83ce-77fe51831961",
// 		},
// 		{
// 			child_id: "4e9fd25f-ed9c-40ae-a2ad-1a75677a2668",
// 			parent_id: "654d91f1-6139-434c-9047-9fff751ed0c4",
// 		},
// 	];

// 	await lix.db.insertInto("change").values(mockChanges).execute();

// 	await lix.db.insertInto("change_edge").values(edges).execute();

// 	await updateChangesInVersion({
// 		lix,
// 		version: sourceversion,
// 		changes: [
// 			mockChanges.find(
// 				(change) => change.id === "a4b48412-f809-49c9-83ce-77fe51831961",
// 			)!,
// 		],
// 	});

// 	await updateChangesInVersion({
// 		lix,
// 		version: targetversion,
// 		changes: [
// 			mockChanges.find(
// 				(change) => change.id === "654d91f1-6139-434c-9047-9fff751ed0c4",
// 			)!,
// 		],
// 	});

// 	// await lix.db
// 	// 	.insertInto("version_target")
// 	// 	.values({
// 	// 		source_version_id: sourceversion.id,
// 	// 		target_version_id: targetversion.id,
// 	// 	})
// 	// 	.execute();

// 	await updateChangesInVersion({
// 		lix,
// 		version: targetversion,
// 		changes: [
// 			mockChanges.find(
// 				(change) => change.id === "4e9fd25f-ed9c-40ae-a2ad-1a75677a2668",
// 			)!,
// 		],
// 	});

// 	await lix.settled();

// 	const conflicts = await lix.db
// 		.selectFrom("change_conflict")
// 		.selectAll()
// 		.execute();

// 	const conflictElements = await lix.db
// 		.selectFrom("change_conflict_element")
// 		.selectAll()
// 		.execute();

// 	expect(conflicts.length).toBe(1);
// 	expect(conflictElements.length).toBe(2);
// });
