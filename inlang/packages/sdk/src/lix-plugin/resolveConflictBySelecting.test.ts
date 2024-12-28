// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { test, expect } from "vitest";
import { newProject } from "../project/newProject.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import {
	isInSimulatedCurrentBranch,
	resolveConflictBySelecting,
} from "@lix-js/sdk";
import { contentFromDatabase } from "sqlite-wasm-kysely";

test.skip("it should resolve a conflict with the selected change", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	const dbFile = await project.lix.db
		.selectFrom("file")
		.select("id")
		.where("path", "=", "/db.sqlite")
		.executeTakeFirstOrThrow();

	const changes = await project.lix.db
		.insertInto("change")
		.values([
			{
				id: "e59b2fc6-612d-4087-9790-03b2ab724274",
				author: "Anonymous",
				file_id: dbFile.id,
				plugin_key: "inlang-lix-plugin-v1",
				operation: "create",
				type: "bundle",
				value: {
					id: "even_hour_mule_drum",
				},
				created_at: "2024-08-28 20:58:04",
			},
			{
				id: "c0c9e3f3-0eba-4233-813f-e1901401a653",
				author: "Anonymous",
				file_id: dbFile.id,
				plugin_key: "inlang-lix-plugin-v1",
				operation: "create",
				type: "message",
				value: {
					id: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
					bundleId: "even_hour_mule_drum",
					locale: "en",
					selectors: [],
				},
				created_at: "2024-08-28 20:58:04",
			},
			{
				id: "b92a634f-1e25-410f-af5a-e8702cc92ef0",
				author: "Anonymous",
				file_id: dbFile.id,
				plugin_key: "inlang-lix-plugin-v1",
				operation: "create",
				type: "variant",
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
				},
				created_at: "2024-08-28 20:58:04",
			},
			{
				id: "samuels-change",
				author: "Samuel",
				parent_id: "b92a634f-1e25-410f-af5a-e8702cc92ef0",
				file_id: dbFile.id,
				plugin_key: "inlang-lix-plugin-v1",
				operation: "update",
				type: "variant",
				value: {
					id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
					messageId: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
					matches: [],
					pattern: [
						{
							type: "text",
							value: "My awesome lix app",
						},
					],
				},
				meta: {
					id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
				},
				created_at: "2024-08-28 21:29:05",
			},
			{
				id: "peters-change",
				author: "Peter",
				parent_id: "b92a634f-1e25-410f-af5a-e8702cc92ef0",
				file_id: dbFile.id,
				plugin_key: "inlang-lix-plugin-v1",
				operation: "update",
				type: "variant",
				value: {
					id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
					messageId: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
					matches: [],
					pattern: [
						{
							type: "text",
							value: "You are building an app",
						},
					],
				},
				meta: {
					id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
				},
				created_at: "2024-08-28 21:29:35",
			},
		])
		.returningAll()
		.execute();

	// ---------------
	// Todo inlang sdk should auto write file to lix and differ must be
	// fault tolerant. without this code, the differ captures an old
	// change again

	for (const change of changes) {
		await project.db
			.insertInto(change.type as any)
			.values(change.value as any)
			.onConflict((c) => c.doNothing())
			.execute();
	}
	await project.lix.db
		.updateTable("file")
		.set({ data: contentFromDatabase(project._sqlite) })
		.where("path", "=", "/db.sqlite")
		.execute();
	// ---------------

	const conflicts = await project.lix.db
		.insertInto("conflict")
		.values([
			{
				change_id: "samuels-change",
				conflicting_change_id: "peters-change",
				reason: "",
			},
		])
		.returningAll()
		.execute();

	const changesInCurrentBranchBefore = await project.lix.db
		.selectFrom("change")
		.selectAll()
		.where(isInSimulatedCurrentBranch)
		.execute();

	expect(changesInCurrentBranchBefore.map((c) => c.id)).toEqual([
		changes[0]?.id,
		changes[1]?.id,
		changes[2]?.id,
		"samuels-change",
	]);

	await resolveConflictBySelecting({
		lix: project.lix,
		conflict: conflicts[0]!,
		selectChangeId: "peters-change",
	});

	await project.lix.settled();

	const changesInCurrentBranch = await project.lix.db
		.selectFrom("change")
		.selectAll()
		.where(isInSimulatedCurrentBranch)
		.execute();

	expect(changesInCurrentBranch.map((c) => c.id)).toEqual([
		changes[0]?.id,
		changes[1]?.id,
		changes[2]?.id,
		"peters-change",
	]);
});
