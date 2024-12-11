import {
	Version,
	openLixInMemory,
	Account,
	switchAccount,
	Lix,
} from "@lix-js/sdk";
import { atom } from "jotai";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { lixCsvDemoFile } from "./helper/demo-lix-file/demoLixFile.ts";

export const LIX_FILE_NAME = "demo.lix";

export const fileIdSearchParamsAtom = atom(async (get) => {
	get(withPollingAtom);
	// Using window is a limitation of react router v6.
	//
	// No programmatic routing possibility exists outside of
	// the react component tree. A better solution is to
	// let react router handle the re-direct in the route
	// config. But for now, this works.
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("f");
});

export const discussionSearchParamsAtom = atom(async (get) => {
	get(withPollingAtom);
	const searchParams = new URL(window.location.href).searchParams;
	return searchParams.get("d");
});

let existingSafeLixToOpfsInterval: ReturnType<typeof setInterval> | undefined;

export const lixAtom = atom(async () => {
	// if (existingSafeLixToOpfsInterval) {
	// 	clearInterval(existingSafeLixToOpfsInterval);
	// }

	const rootHandle = await getOriginPrivateDirectory();
	const fileHandle = await rootHandle.getFileHandle(LIX_FILE_NAME, {
		create: true,
	});
	const file = await fileHandle.getFile();
	const isNewLix = file.size === 0;
	const lix = await openLixInMemory({
		blob: isNewLix ? await lixCsvDemoFile() : file,
		providePlugins: [csvPlugin],
	});

	// Initialize accounts from localStorage
	await initializeAccountsFromStorage(lix);

	// * naive set interval leads to bugs.
	// * search for `saveLixToOpfs` in the code base
	// existingSafeLixToOpfsInterval = setInterval(async () => {
	// 	const writable = await fileHandle.createWritable();
	// 	const file = await lix.toBlob();
	// 	await writable.write(file);
	// 	await writable.close();
	// }, 5000);

	// @ts-expect-error - Expose for debugging.
	window.deleteLix = async () => {
		clearInterval(existingSafeLixToOpfsInterval);
		await rootHandle.removeEntry(LIX_FILE_NAME);
	};

	return lix;
});

/**
 * Ugly ass workaround to get polled derived state.
 *
 * Search where the atom is set (likely in the layout/root component).
 */
export const withPollingAtom = atom(Date.now());

export const currentVersionAtom = atom<
	Promise<Version & { targets: Version[] }>
>(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.innerJoin("version", "version.id", "current_version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// const targets = await lix.db
	// 	.selectFrom("branch_target")
	// 	.where("source_branch_id", "=", currentVersion.id)
	// 	.innerJoin("branch", "branch_target.target_branch_id", "branch.id")
	// 	.selectAll("branch")
	// 	.execute();

	return { ...currentVersion, targets: [] };
});

export const existingVersionsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	return await lix.db.selectFrom("version").selectAll().execute();
});

export const filesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	return await lix.db.selectFrom("file").selectAll().execute();
});

export const ACTIVE_ACCOUNT_STORAGE_KEY = "lix-active-account";

export const activeAccountsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);

	return await lix.db
		.selectFrom("active_account")
		.innerJoin("account", "active_account.id", "account.id")
		.selectAll("account")
		.execute();
});

export const activeAccountAtom = atom(
	// getter
	async (get) => {
		get(withPollingAtom);
		const activeAccounts = await get(activeAccountsAtom);

		// Try to get account from localStorage first
		const storedAccount = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
		if (storedAccount) {
			const parsedAccount = JSON.parse(storedAccount);
			// Verify the stored account still exists in the active accounts
			const existingAccount = activeAccounts.find(
				(acc) => acc.id === parsedAccount.id
			);
			if (existingAccount) {
				return existingAccount;
			}
		}

		// Fall back to first active account if no stored account found
		return activeAccounts[0] || null;
	},
	// setter
	async (get, set, account: Account | null) => {
		const lix = await get(lixAtom);

		if (account) {
			await switchAccount({ lix, to: [account] });
			localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
		} else {
			localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
			await switchAccount({ lix, to: [] });
		}

		// Trigger a refresh of dependent atoms
		set(withPollingAtom, Date.now());
		return account;
	}
);

export const ANONYMOUS_ACCOUNT_ID = "anonymous";

export const ANONYMOUS_CLICKED_KEY = "lix-anonymous-clicked";

export const resetAnonymousState = () => {
	localStorage.removeItem(ANONYMOUS_CLICKED_KEY);
};

export const accountsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	const accounts = await lix.db.selectFrom("account").selectAll().execute();

	// Reset anonymous clicked state if no anonymous account exists
	if (!accounts.some((acc) => acc.id === ANONYMOUS_ACCOUNT_ID)) {
		resetAnonymousState();
	}

	return accounts;
});

// Helper function to switch active account
export const switchActiveAccount = async (lix: Lix, account: Account) => {
	await switchAccount({ lix, to: [account] });
	localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
};

export const continueAsAnonymous = async (lix: Lix) => {
	// Check if anonymous account exists
	const anonymousAccount = await lix.db
		.selectFrom("account")
		.where("id", "=", ANONYMOUS_ACCOUNT_ID)
		.selectAll()
		.executeTakeFirst();

	// Create anonymous account if it doesn't exist
	const account =
		anonymousAccount ||
		(await lix.db
			.insertInto("account")
			.values({
				id: ANONYMOUS_ACCOUNT_ID,
				name: "Anonymous",
			})
			.returningAll()
			.executeTakeFirstOrThrow());

	// Switch to anonymous account
	await switchAccount({ lix, to: [account] });
	localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
	return account;
};

export const ACCOUNTS_STORAGE_KEY = "lix-accounts";

export const initializeAccountsFromStorage = async (lix: Lix) => {
	const storedAccounts = loadAccountsFromStorage();
	const storedActiveAccount = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);

	if (storedAccounts.length > 0) {
		// Insert stored accounts into database
		await Promise.all(
			storedAccounts.map(async (account) => {
				try {
					await lix.db
						.insertInto("account")
						.values(account)
						.onConflict((oc) => oc.doNothing())
						.execute();
				} catch (error) {
					console.error("Error restoring account:", error);
				}
			})
		);

		// Try to restore previous active account
		if (storedActiveAccount) {
			const parsedAccount = JSON.parse(storedActiveAccount);
			const existingAccount = storedAccounts.find(
				(acc) => acc.id === parsedAccount.id
			);

			if (existingAccount) {
				await switchAccount({ lix, to: [existingAccount] });
			} else {
				// If previous account not found, try to find anonymous account
				const anonymousAccount = storedAccounts.find(
					(acc) => acc.id === ANONYMOUS_ACCOUNT_ID
				);
				if (anonymousAccount) {
					await switchAccount({ lix, to: [anonymousAccount] });
				} else {
					// Create anonymous account as fallback
					await continueAsAnonymous(lix);
				}
			}
		}
	}
};

export const saveAccountsToStorage = (accounts: Account[]) => {
	localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
};

export const loadAccountsFromStorage = (): Account[] => {
	const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
	return stored ? JSON.parse(stored) : [];
};

export const serverUrlAtom = atom<string | null>(null);
