import {
	fileQueueSettled,
	Lix,
	newLixFile,
	openLixInMemory,
	toBlob,
	createCheckpoint,
	createDiscussion,
} from "@lix-js/sdk";
import { plugin as txtPlugin } from "@lix-js/plugin-txt";
import { switchActiveAccount } from "@/state";
import { getDiscussion, getWorkingChangeSet } from "../state-active-file";

/**
 * Executes a function as the Flashtype account and then restores the original account
 */
export async function withFlashtypeAccount<T>(
	lix: Lix,
	fn: (lix: Lix) => Promise<T>
): Promise<T> {
	// Get the current active account to restore it later
	const currentActiveAccount = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	// Create and switch to a Flashtype account
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

	// Execute the provided function
	const result = await fn(lix);

	// Switch back to the user account if it existed
	if (currentActiveAccount) {
		await switchActiveAccount(lix, currentActiveAccount);
	}

	return result;
}

export async function setupWelcomeFile(lix?: Lix): Promise<{ blob: Blob }> {
	if (!lix) {
		lix = await openLixInMemory({
			blob: await newLixFile(),
			providePlugins: [txtPlugin],
		});
	}

	await withFlashtypeAccount(lix, async (lixWithFlashtype) => {
		const file = await setupMdWelcome(lixWithFlashtype);
		await fileQueueSettled({ lix: lixWithFlashtype });
		await createInitialCheckpoint(lixWithFlashtype, file.id);
	});

	return { blob: await toBlob({ lix }) };
}

export const serverUrl = import.meta.env.PROD
	? "https://lix-md.onrender.com"
	: "http://localhost:3009";

export const welcomeMd = `# Flashtype.ai ⚡️

### 🤖 Autocomplete your document

![](${serverUrl}/images/Autocomplete.png)

### 📚 Learns your writing style ([Upvote #45](https://github.com/opral/flashtype.ai/issues/45))

![](${serverUrl}/images/WritingStyle.png)

### 📝 Work with AI Cowriters ([Upvote #46](https://github.com/opral/flashtype.ai/issues/46))

![](${serverUrl}/images/Cowriters.png)

### 🤝 Collaborate and Publish ([Upvote #47](https://github.com/opral/flashtype.ai/issues/47))

![](${serverUrl}/images/Collaborate.png)\n\n`;

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

const createInitialCheckpoint = async (lix: Lix, fileId: string) => {
	// Get the working change set for the discussion using the utility function
	const changeSet = await getWorkingChangeSet(lix, fileId);

	if (changeSet) {
		await createDiscussion({
			lix,
			changeSet,
			firstComment: { content: "Setup welcome file" },
		});
	}
	await createCheckpoint({ lix });
};
