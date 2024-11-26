import { useAtom } from "jotai";
import { useState, useEffect } from "react";
import { activeAccountAtom, accountsAtom, lixAtom } from "../state.js";

export function useSidebarState() {
	const [accountDialogOpen, setAccountDialogOpen] = useState(false);
	const [accounts] = useAtom(accountsAtom);
	const [activeAccount] = useAtom(activeAccountAtom);
	const [lix] = useAtom(lixAtom);

	useEffect(() => {
		if (!lix) return;

		Promise.all([Promise.resolve(accounts), Promise.resolve(activeAccount)])
			.then(([accountsList, currentAccount]) => {
				const nonAnonymousAccounts = accountsList?.filter(
					(account) => account.name !== "anonymous"
				);

				if (!currentAccount || nonAnonymousAccounts?.length === 0) {
					setAccountDialogOpen(true);
				}
			})
			.catch((error) => {
				console.error("Error checking accounts:", error);
			});
	}, [lix, accounts, activeAccount]);

	return {
		accountDialogOpen,
		setAccountDialogOpen,
		activeAccount,
		accounts,
	};
}
