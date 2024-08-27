import { merge, type Change } from "@lix-js/sdk";
import { test, expect } from "vitest";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import { inlangLixPluginV1 } from "./inlangLixPluginV1.js";

test("it should update the variant to the source's value", async () => {
	const target = await loadProjectInMemory({ blob: await newProject() });
	const source = await loadProjectInMemory({ blob: await target.toBlob() });

	const dbFile = await target.lix.db
		.selectFrom("file")
		.select("id")
		.where("path", "=", "/db.sqlite")
		.executeTakeFirstOrThrow();

	const commonChanges: Change[] = [
		{
			id: "d92cdc2e-74cc-494c-8d51-958216272a17",
			parent_id: undefined,
			type: "bundle",
			file_id: dbFile.id,
			plugin_key: inlangLixPluginV1["key"],
			operation: "create",
			// @ts-expect-error - https://github.com/opral/inlang-message-sdk/issues/123
			value: JSON.stringify({
				id: "even_hour_mule_drum",
				alias: {
					default: "title",
				},
			}),
			// @ts-expect-error - https://github.com/opral/inlang-message-sdk/issues/123
			meta: JSON.stringify(undefined),
			commit_id: "c8ad005b-a834-4ca3-84fb-9627546f2eba",
		},
		{
			id: "24f74fec-fc8a-4c68-b31c-d126417ce3af",
			parent_id: undefined,
			type: "message",
			file_id: dbFile.id,
			plugin_key: inlangLixPluginV1["key"],
			operation: "create",
			// @ts-expect-error - https://github.com/opral/inlang-message-sdk/issues/123
			value: JSON.stringify({
				id: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
				bundleId: "even_hour_mule_drum",
				locale: "en",
				declarations: [],
				selectors: [],
			}),
			// @ts-expect-error - https://github.com/opral/inlang-message-sdk/issues/123
			meta: JSON.stringify(undefined),
			commit_id: "c8ad005b-a834-4ca3-84fb-9627546f2eba",
		},
		{
			id: "aaf0ec32-0c7f-4d07-af8c-922ce382aef1",
			parent_id: undefined,
			type: "variant",
			file_id: dbFile.id,
			plugin_key: inlangLixPluginV1["key"],
			operation: "create",
			// @ts-expect-error - https://github.com/opral/inlang-message-sdk/issues/123
			value: JSON.stringify({
				id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
				messageId: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
				match: {},
				pattern: [
					{
						type: "text",
						value: "My Awesome Todo App",
					},
				],
			}),
			// @ts-expect-error - https://github.com/opral/inlang-message-sdk/issues/123
			meta: JSON.stringify(undefined),
			commit_id: "c8ad005b-a834-4ca3-84fb-9627546f2eba",
		},
	];

	const changesOnlyInTarget: Change[] = [];
	const changesOnlyInSource: Change[] = [
		{
			id: "01c059f9-8476-4aaa-aa6d-53ea3158b374",
			parent_id: "aaf0ec32-0c7f-4d07-af8c-922ce382aef1",
			type: "variant",
			file_id: dbFile.id,
			plugin_key: inlangLixPluginV1["key"],
			operation: "update",
			// @ts-expect-error - https://github.com/opral/inlang-message-sdk/issues/123
			value: JSON.stringify({
				id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
				messageId: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
				match: {},
				pattern: [
					{
						type: "text",
						value: "My app is buggy",
					},
				],
			}),
			// @ts-expect-error - https://github.com/opral/inlang-message-sdk/issues/123
			meta: JSON.stringify({
				id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
			}),
			commit_id: "df455c78-b5ed-4df0-9259-7bb694c9d755",
		},
	];

	await source.lix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInSource])
		.execute();

	await target.lix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTarget])
		.execute();

	await merge({ sourceLix: source.lix, targetLix: target.lix });

	await target.lix.settled();

	// need to reload project to re-initialize the state
	const mergedProject = await loadProjectInMemory({
		blob: await target.toBlob(),
	});

	const changes = await mergedProject.lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	expect(changes).lengthOf(4);

	const variant = await mergedProject.db
		.selectFrom("variant")
		.selectAll()
		.where("id", "=", "6a860f96-0cf3-477c-80ad-7893d8fde852")
		.executeTakeFirstOrThrow();

	expect(JSON.stringify(variant)).toEqual(changesOnlyInSource[0]?.value);
});
