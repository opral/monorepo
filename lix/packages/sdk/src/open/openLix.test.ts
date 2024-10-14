import { expect, test } from "vitest";
import { openLixInMemory } from "./openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { LixPlugin } from "../plugin.js";
import { uuidv4 } from "../index.js";

test("providing plugins should be possible", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {},
	};
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});
	expect(lix.plugins).toContain(mockPlugin);
});

test.todo(
	"changes should contain the operation reported by diffs",
	async () => {
		const mockPlugin: LixPlugin = {
			key: "mock-plugin",
			glob: "*",
			diff: {
				file: async ({ after }) => {
					const json = JSON.parse(new TextDecoder().decode(after?.data));
					return [
						{
							type: "mock",
							operation: "create",
							before: undefined,
							after: {
								id: "uuid",
								name: json["name"],
							},
						},
					];
				},
			},
		};
		const mockJson = {
			name: "Darth Vader",
		};
		const lix = await openLixInMemory({
			blob: await newLixFile(),
			providePlugins: [mockPlugin],
		});
		await lix.db
			.insertInto("file")
			.values({
				id: uuidv4(),
				path: "/mock-file.json",
				data: new TextEncoder().encode(JSON.stringify(mockJson)),
			})
			.execute();
		// workaround for settled
		await new Promise((resolve) => setTimeout(resolve, 1000));
		// TODO selectFrom change doesn't resolve
		const changes = await lix.db.selectFrom("change").selectAll().execute();
		expect(changes.length).toBe(1);
		expect(changes[1]?.operation).toBe("insert");
		expect(changes[1]?.value?.name).toBe("Darth Vader");
	},
);
