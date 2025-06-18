import { openLixInMemory } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";
import { initLixInspector } from "@lix-js/inspector";

export const lix = await openLixInMemory({
	providePlugins: [prosemirrorPlugin],
});

// dev tool for debugging
initLixInspector({ lix });

const mockId = "mock-prosemirror-file-id";

export const prosemirrorFile = {
	id: mockId,
};

if (
	(await lix.db
		.selectFrom("file")
		.where("path", "=", "/prosemirror.json")
		.select("id")
		.executeTakeFirst()) === undefined
) {
	await lix.db
		.insertInto("file")
		.values({
			id: mockId,
			path: "/prosemirror.json",
			data: new TextEncoder().encode(
				JSON.stringify({
					type: "doc",
					content: [],
				}),
			),
		})
		.execute();
}
