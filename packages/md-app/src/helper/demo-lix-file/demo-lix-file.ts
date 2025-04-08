import {
	fileQueueSettled,
	Lix,
	newLixFile,
	openLixInMemory,
	toBlob,
} from "@lix-js/sdk";
import { plugin as txtPlugin } from "@lix-js/plugin-txt";
import { EMPTY_DOCUMENT_PROMPT_KEY } from "@/components/editor/plugins/empty-document-prompt-plugin";

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

	await setupWelcomeFile(lix);
	await fileQueueSettled({ lix });

	return { blob: await toBlob({ lix }), id: id.value };
}

const welcomeMd = `# Flashtype.ai ⚡️

### 🤖 Autocomplete your document

### 📚 Learns your writing style ([Upvote #45](https://github.com/opral/flashtype.ai/issues/45))

### 📝 Work with AI Cowriters ([Upvote #46](https://github.com/opral/flashtype.ai/issues/46))

### 🤝 Collaborate and Publish ([Upvote #47](https://github.com/opral/flashtype.ai/issues/47))`;

// This will be used for serializing/deserializing markdown with the proper empty prompt element
const emptyPromptElement = {
	type: EMPTY_DOCUMENT_PROMPT_KEY,
	children: [{ text: '' }],
};

export const setupWelcomeFile = async (lix: Lix) => {
	// Prepare markdown - emptyPromptElement will be inserted when the editor loads
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
