import { merge, type NewChange } from "@lix-js/sdk";
import { test, expect } from "vitest";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import { inlangLixPluginV1 } from "./inlangLixPluginV1.js";
import type { NewBundle, NewMessage, NewVariant } from "../database/schema.js";

test("it should update the variant to the source's value", async () => {
	const target = await loadProjectInMemory({ blob: await newProject() });
	const currentTargetBranch = await target.lix.db
		.selectFrom("branch")
		.selectAll()
		.where("active", "=", true)
		.executeTakeFirstOrThrow();
	const source = await loadProjectInMemory({ blob: await target.toBlob() });
	const currentSourceBranch = await source.lix.db
		.selectFrom("branch")
		.selectAll()
		.where("active", "=", true)
		.executeTakeFirstOrThrow();

	const dbFile = await target.lix.db
		.selectFrom("file")
		.select("id")
		.where("path", "=", "/db.sqlite")
		.executeTakeFirstOrThrow();

	const commonChanges: NewChange[] = [
		{
			id: "d92cdc2e-74cc-494c-8d51-958216272a17",
			parent_id: undefined,
			type: "bundle",
			file_id: dbFile.id,
			plugin_key: inlangLixPluginV1["key"],
			operation: "create",
			value: {
				id: "even_hour_mule_drum",
			} satisfies NewBundle,
		},
		{
			id: "24f74fec-fc8a-4c68-b31c-d126417ce3af",
			parent_id: undefined,
			type: "message",
			file_id: dbFile.id,
			plugin_key: inlangLixPluginV1["key"],
			operation: "create",
			value: {
				id: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
				bundleId: "even_hour_mule_drum",
				locale: "en",
				selectors: [],
			} satisfies NewMessage,
		},
		{
			id: "aaf0ec32-0c7f-4d07-af8c-922ce382aef1",
			parent_id: undefined,
			type: "variant",
			file_id: dbFile.id,
			plugin_key: inlangLixPluginV1["key"],
			operation: "create",
			value: {
				id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
				messageId: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
				matches: [],
				pattern: [
					{
						type: "text",
						value: "My Awesome Todo App",
					},
				],
			} satisfies NewVariant,
		},
	];

	const changesOnlyInTarget: NewChange[] = [];
	const changesOnlyInSource: NewChange[] = [
		{
			id: "01c059f9-8476-4aaa-aa6d-53ea3158b374",
			parent_id: "aaf0ec32-0c7f-4d07-af8c-922ce382aef1",
			type: "variant",
			file_id: dbFile.id,
			plugin_key: inlangLixPluginV1["key"],
			operation: "update",
			value: {
				id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
				messageId: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
				matches: [],
				pattern: [
					{
						type: "text",
						value: "My app is buggy",
					},
				],
			} satisfies NewVariant,
			meta: {
				id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
			},
		},
	];

	await source.lix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInSource])
		.execute();

	await source.lix.db
		.insertInto("branch_change")
		.values([
			{
				branch_id: currentSourceBranch.id,
				change_id: "d92cdc2e-74cc-494c-8d51-958216272a17",
				seq: 1,
			},
			{
				branch_id: currentSourceBranch.id,
				change_id: "24f74fec-fc8a-4c68-b31c-d126417ce3af",
				seq: 2,
			},
			{
				branch_id: currentSourceBranch.id,
				change_id: "aaf0ec32-0c7f-4d07-af8c-922ce382aef1",
				seq: 3,
			},
			{
				branch_id: currentSourceBranch.id,
				change_id: "01c059f9-8476-4aaa-aa6d-53ea3158b374",
				seq: 4,
			},
		])
		.execute();

	await target.lix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTarget])
		.execute();

	await target.lix.db
		.insertInto("branch_change")
		.values([
			{
				branch_id: currentTargetBranch.id,
				change_id: "d92cdc2e-74cc-494c-8d51-958216272a17",
				seq: 1,
			},
			{
				branch_id: currentTargetBranch.id,
				change_id: "24f74fec-fc8a-4c68-b31c-d126417ce3af",
				seq: 2,
			},
			{
				branch_id: currentTargetBranch.id,
				change_id: "aaf0ec32-0c7f-4d07-af8c-922ce382aef1",
				seq: 3,
			},
		])
		.execute();

	await merge({ sourceLix: source.lix, targetLix: target.lix });

	await target.lix.settled();

	// need to reload project to re-initialize the state
	const mergedProject = await loadProjectInMemory({
		blob: await target.toBlob(),
	});

	const changes = await mergedProject.lix.db
		.selectFrom("change_view")
		.where("branch_id", "=", currentTargetBranch.id)
		.selectAll()
		.execute();

	expect(changes).lengthOf(4);

	const variant = await mergedProject.db
		.selectFrom("variant")
		.selectAll()
		.where("id", "=", "6a860f96-0cf3-477c-80ad-7893d8fde852")
		.executeTakeFirstOrThrow();

	expect(variant).toEqual(
		expect.objectContaining(changesOnlyInSource[0]?.value)
	);
});
