import {
	fileQueueSettled,
	Lix,
	newLixFile,
	openLixInMemory,
	toBlob,
} from "@lix-js/sdk";
import { plugin as txtPlugin } from "@lix-js/plugin-txt";

export async function lixMdDemoFile(): Promise<{ blob: Blob; id: string }> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [txtPlugin],
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	await setupMdDemo(lix);
	await fileQueueSettled({ lix });

	return { blob: await toBlob({ lix }), id: id.value };
}

export const setupMdDemo = async (lix: Lix) => {
	// Load a demo md file and save it to OPFS
	const file = await lix.db
		.insertInto("file")
		.values({
			path: "/welcome.md",
			data: new TextEncoder().encode(`# Flashtype.ai ⚡️

### Autocomplete your document

Try the **AI commands** or use \`Cmd+J\` to open the AI menu.

### Learns your writing style ([Upvote #45](https://github.com/opral/flashtype.ai/issues/45))

### Work with AI Cowriters ([Upvote #46](https://github.com/opral/flashtype.ai/issues/46))

### Collaborate and Publish ([Upvote #47](https://github.com/opral/flashtype.ai/issues/47))

`),
		})
		.returningAll()
		.executeTakeFirstOrThrow();
	return file;
};
