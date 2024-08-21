import { test, expect, vi } from "vitest";
import { handleFileInsert } from "./file-handlers.js";
import { newLixFile } from "./newLix.js";
import { openLixInMemory } from "./open/openLixInMemory.js";
import type { DiffReport, LixPlugin } from "./plugin.js";

test("handleFileInsert should insert a current timestamp", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn().mockResolvedValue([
				{
					operation: "create",
					type: "mock",
					neu: {
						id: "mock",
						value: "new value",
					},
					old: undefined,
				} satisfies DiffReport,
			]),
		},
	};

	const mockQueueEntry = { id: "mock-id" };

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});


	await handleFileInsert({
		db: lix.db,
		plugins: lix.plugins,
		neu: {
			id: "mock",
			path: "/mock",
			data: new Uint8Array(),
		},
		queueEntry: mockQueueEntry,
	});

	const changes = await lix.db.selectFrom("change").selectAll().execute();
	expect(changes).lengthOf(1);
});

test.todo("handleFileInsert should insert the current author id", async () => {
	throw new Error("Not implemented");
});

test.todo("handleFileUpdate should insert the current author id", async () => {
	throw new Error("Not implemented");
});
