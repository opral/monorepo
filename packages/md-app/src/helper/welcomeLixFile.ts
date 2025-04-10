import {
	fileQueueSettled,
	Lix,
	newLixFile,
	openLixInMemory,
	toBlob,
	createDiscussion,
} from "@lix-js/sdk";
import { plugin as txtPlugin } from "@lix-js/plugin-txt";
import { switchActiveAccount } from "@/state";
import { createCheckpoint } from "./createCheckpoint";

export async function lixMdWelcomeFile(): Promise<{ blob: Blob; id: string }> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [txtPlugin],
	});

	// Get the current active account to restore it later
	const currentActiveAccount = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	// Create and switch to a Flashtype account before creating the checkpoint
	const existingAccounts = await lix.db
		.selectFrom("account")
		.selectAll()
		.execute();
	const flashtypeAccount = existingAccounts.find(
		(account) => account.name === "Flashtype"
	);

	let accountToUse;
	// Create a Flashtype account if it doesn't exist
	if (!flashtypeAccount) {
		accountToUse = await lix.db
			.insertInto("account")
			.values({
				name: "Flashtype",
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	} else {
		accountToUse = flashtypeAccount;
	}

	// Switch to the Flashtype account using the existing helper function
	await switchActiveAccount(lix, accountToUse);

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	await setupMdWelcome(lix);
	await fileQueueSettled({ lix });
	await createInitialCheckpoint(lix);

	// Switch back to the user account if it existed
	if (currentActiveAccount) {
		await switchActiveAccount(lix, currentActiveAccount);
	}

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

const createInitialCheckpoint = async (lix: Lix) => {
	const changeIds = await lix.db
		.selectFrom("change")
		.select("change.id")
		.execute();

	// Now create the checkpoint with the Flashtype account
	const changeSet = await createCheckpoint(lix, changeIds);
	await createDiscussion({
		lix,
		changeSet,
		firstComment: { content: "Setup welcome file" },
	});
};
