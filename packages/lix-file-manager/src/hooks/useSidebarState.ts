import { useAtom } from "jotai";
import { useState, useEffect, useTransition } from "react";
import {
	activeAccountAtom,
	accountsAtom,
	lixAtom,
	ACTIVE_ACCOUNT_STORAGE_KEY,
	continueAsAnonymous,
} from "../state.js";

export function useSidebarState() {
	const [accountDialogOpen, setAccountDialogOpen] = useState(false);
	const [accounts] = useAtom(accountsAtom);
	const [activeAccount, setActiveAccount] = useAtom(activeAccountAtom);
	const [lix] = useAtom(lixAtom);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!lix) return;

		startTransition(() => {
			Promise.all([Promise.resolve(accounts), Promise.resolve(activeAccount)])
				.then(async ([accountsList, currentAccount]) => {
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
								await setActiveAccount(existingAccount);
								return;
							}
						}
						await continueAsAnonymous(lix);
					}
				})
				.catch((error) => {
					console.error("Error checking accounts:", error);
				});
		});
	}, [lix, accounts, activeAccount, setActiveAccount]);

	const handleSetAccountDialogOpen = (open: boolean) => {
		startTransition(() => {
			setAccountDialogOpen(open);
		});
	};

	return {
		accountDialogOpen,
		setAccountDialogOpen: handleSetAccountDialogOpen,
		activeAccount,
		accounts,
		isPending,
	};
}
