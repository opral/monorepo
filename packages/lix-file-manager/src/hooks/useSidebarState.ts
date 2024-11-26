import { useAtom } from "jotai";
import { useState, useEffect } from "react";
import {
	activeAccountAtom,
	accountsAtom,
	lixAtom,
	ACTIVE_ACCOUNT_STORAGE_KEY,
} from "../state.js";

export function useSidebarState() {
	const [accountDialogOpen, setAccountDialogOpen] = useState(false);
	const [accounts] = useAtom(accountsAtom);
	const [activeAccount, setActiveAccount] = useAtom(activeAccountAtom);
	const [lix] = useAtom(lixAtom);

	useEffect(() => {
		if (!lix) return;

		Promise.all([Promise.resolve(accounts), Promise.resolve(activeAccount)])
			.then(([accountsList, currentAccount]) => {
				const nonAnonymousAccounts = accountsList?.filter(
					(account) => account.name !== "anonymous"
				);

				if (!currentAccount) {
					const storedAccount = localStorage.getItem(
						ACTIVE_ACCOUNT_STORAGE_KEY
					);
					if (storedAccount) {
						const parsedAccount = JSON.parse(storedAccount);
						const existingAccount = accountsList?.find(
							(acc) => acc.id === parsedAccount.id
						);
						if (existingAccount) {
							setActiveAccount(existingAccount);
							return;
						}
					}
				}

				if (!currentAccount || nonAnonymousAccounts?.length === 0) {
					setAccountDialogOpen(true);
				}
			})
			.catch((error) => {
				console.error("Error checking accounts:", error);
			});
	}, [lix, accounts, activeAccount, setActiveAccount]);

	return {
		accountDialogOpen,
		setAccountDialogOpen,
		activeAccount,
		accounts,
	};
}
