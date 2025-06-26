import {
	Lix,
	newLixFile,
	openLix,
	toBlob,
	createCheckpoint,
	createThread,
	createAccount,
} from "@lix-js/sdk";
import { plugin as txtPlugin } from "@lix-js/plugin-txt";
import { switchActiveAccount } from "@/state";
import { getWorkingChangeSet } from "../state-active-file";
import { fromPlainText } from "@lix-js/sdk/zettel-ast";

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
		accountToUse = await createAccount({
			lix,
			name: "Flashtype",
		});
	} else {
		accountToUse = flashtypeAccount;
	}

	console.log("hello world");

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
		lix = await openLix({
			blob: await newLixFile(),
			providePlugins: [txtPlugin],
		});
	}

	await withFlashtypeAccount(lix, async (lixWithFlashtype) => {
		const file = await setupMdWelcome(lixWithFlashtype);
		await createInitialCheckpoint(lixWithFlashtype, file.id);
	});

	return { blob: await toBlob({ lix }) };
}

export const serverUrl = import.meta.env.PROD
	? window.location.hostname === "lix.host"
		? "https://lix.host/app/flashtype"
		: "https://flashtype.ai"
	: "http://localhost:3009";

export const welcomeMd = `# Flashtype.ai ⚡️ - The AI Markdown Editor

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

<br />

***

### 📝 Markdown Editor - familiar & powerful ([Upvote #45](https://github.com/opral/flashtype.ai/issues/45))

Write the way you know and love. Flashtype is a Markdown editor that supports all the features you need to write efficiently. It includes syntax highlighting, auto-completion, and a clean interface.

![](${serverUrl}/images/markdown.png)

### 🤖 AI Editor - Go beyond Google Docs and Notion ([Upvote #46](https://github.com/opral/flashtype.ai/issues/46))

AI is at the heart of your writing experience. It helps you write better, faster, and more efficiently. The AI editor includes features like auto-completion, summaries, and style suggestions.

![](${serverUrl}/images/ai.png)

### ⚡️ Change Control - Make AI features truly usable ([Upvote #47](https://github.com/opral/flashtype.ai/issues/47))\n\nWhat makes Flashtype unique is its change control system. It allows you to track changes made by the AI and revert to previous versions if needed. This makes it easy to experiment with different writing styles and ideas without losing your original work.

![](${serverUrl}/images/diff.png)

<p><br /></p>\n`;

export const setupMdWelcome = async (lix: Lix) => {
	// Load a demo md file and save it to OPFS
	await lix.db
		.insertInto("file")
		.values({
			path: "/welcome.md",
			data: new TextEncoder().encode(welcomeMd),
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.selectAll()
		.where("path", "=", "/welcome.md")
		.executeTakeFirstOrThrow();
	return file;
};

const initialComment = fromPlainText("Setup welcome file");

const createInitialCheckpoint = async (lix: Lix, fileId: string) => {
	const changeSet = await getWorkingChangeSet(lix, fileId);

	if (changeSet) {
		lix.db.transaction().execute(async (trx) => {
			const thread = await createThread({
				lix: { ...lix, db: trx },
				comments: [{ body: initialComment }],
			});
			await trx
				.insertInto("change_set_thread_all")
				.values({
					change_set_id: changeSet.id,
					thread_id: thread.id,
					lixcol_version_id: "global",
				})
				.execute();
		});
	}
	await createCheckpoint({ lix });
};
