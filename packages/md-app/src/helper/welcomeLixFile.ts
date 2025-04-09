import {
	fileQueueSettled,
	Lix,
	newLixFile,
	openLixInMemory,
	toBlob,
} from "@lix-js/sdk";
import { plugin as txtPlugin } from "@lix-js/plugin-txt";

export async function lixMdWelcomeFile(): Promise<{ blob: Blob; id: string }> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [txtPlugin],
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	await setupMdWelcome(lix);
	await fileQueueSettled({ lix });

	return { blob: await toBlob({ lix }), id: id.value };
}

export const serverUrl = import.meta.env.PROD
	? "https://lix-md.onrender.com/"
	: "http://localhost:3009/";

export const welcomeMd = `# Flashtype.ai ⚡️

### 🤖 Autocomplete your document

![](${serverUrl}/images/Autocomplete.png)

### 📚 Learns your writing style ([Upvote #45](https://github.com/opral/flashtype.ai/issues/45))

![](${serverUrl}/images/WritingStyle.png)

### 📝 Work with AI Cowriters ([Upvote #46](https://github.com/opral/flashtype.ai/issues/46))

![](${serverUrl}/images/Cowriters.png)

### 🤝 Collaborate and Publish ([Upvote #47](https://github.com/opral/flashtype.ai/issues/47))

![](${serverUrl}/images/Collaborate.png)`;

export const setupMdWelcome = async (lix: Lix) => {
	// Load a demo md file and save it to OPFS
	const file = await lix.db
		.insertInto("file")
		.values({
			path: "/welcome.md",
			data: new TextEncoder().encode(welcomeMd),
		})
		.returningAll()
		.executeTakeFirstOrThrow();
	return file;
};
