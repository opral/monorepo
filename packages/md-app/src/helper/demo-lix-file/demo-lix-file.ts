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
			path: "/demo.md",
			data: new TextEncoder().encode(`# The AI Markdown Editor

## [Sign up](https://forms.gle/mpXxyiXsQ6yhuGS58) for the waitlist

---

## Features

### Lix change control

- 🔄 Change tracking: See who changed what
- 📌 Versioning: The possibility to create divergent states (branches in Git)
- 🔀 Change Proposals: (WIP [#242](https://github.com/opral/lix-sdk/issues/242)) Everyone can contribute, you accept or reject changes
- 🤝 Collaboration: Asynchronous (Git-like) or real-time collaboration (Google Docs-like)
- ✅ Validation Rules: (WIP [#239](https://github.com/opral/lix-sdk/issues/239)) Define and enforce validation rules for your document

### Autocompletes your document with AI

Try the **AI commands** or use \`Cmd+J\` to open the AI menu.`),
		})
		.returningAll()
		.executeTakeFirstOrThrow();
	return file;
};
