import React, { useState } from "react";
import { createAccount, switchAccount, Account } from "@lix-js/sdk";
import { getInitials } from "../utilities/nameUtils";
import { ChevronDown } from "lucide-react";
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";

const AccountSelector: React.FC = () => {
	const lix = useLix();
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [newAccountName, setNewAccountName] = useState("");

	const allAccounts = useQuery(() =>
		lix.db
			.selectFrom("account_by_version")
			.where("lixcol_version_id", "=", "global")
			.select(["id", "name"]),
	);

	const activeAccount = useQueryTakeFirst(() =>
		lix.db
			.selectFrom("active_account as aa")
			.innerJoin("account_by_version as a", "a.id", "aa.account_id")
			.where("a.lixcol_version_id", "=", "global")
			.select(["aa.account_id", "a.id", "a.name"]),
	);

	const handleAccountSelect = async (account: Account) => {
		await switchAccount({
			lix,
			to: [account],
		});
		// Close dropdown by removing focus
		(document.activeElement as HTMLElement)?.blur();
	};

	const handleCreateAccountClick = () => {
		setShowCreateDialog(true);
		// Close dropdown by removing focus
		(document.activeElement as HTMLElement)?.blur();
	};

	const handleCreateAccount = async () => {
		if (!newAccountName.trim()) return;

		try {
			const account = await createAccount({
				lix,
				name: newAccountName.trim(),
			});

			// Set it as the active account in the database
			await switchAccount({
				lix,
				to: [account],
			});

			// Reset form
			setNewAccountName("");
			setShowCreateDialog(false);
		} catch (error) {
			console.error("Error creating account:", error);
		}
	};

	// Avatar component with wireframe style
	const Avatar = ({ name }: { name: string }) => (
		<div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-xs font-bold text-base-content mr-2 flex-shrink-0">
			{getInitials(name)}
		</div>
	);

	// Loading state or display account
	return (
		<div className="dropdown dropdown-end">
			<label tabIndex={0} className="btn btn-ghost border border-base-300">
				<div className="flex items-center">
					{activeAccount ? (
						<>
							<Avatar name={activeAccount.name} />
							<span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">
								{activeAccount.name}
							</span>
						</>
					) : (
						<>
							<div className="w-6 h-6 bg-base-300 rounded-full mr-2 flex items-center justify-center text-xs font-bold flex-shrink-0"></div>
							<span>Loading...</span>
						</>
					)}
				</div>
				<ChevronDown size={16} className="ml-2" />
			</label>

			<ul
				tabIndex={0}
				className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-1"
			>
				{allAccounts.map((account) => (
					<li key={account.id}>
						<a
							onClick={() => handleAccountSelect(account)}
							className={`flex items-center ${
								activeAccount && account.id === activeAccount.id ? "active" : ""
							}`}
						>
							<Avatar name={account.name} />
							<span className="overflow-hidden text-ellipsis whitespace-nowrap">
								{account.name}
							</span>
						</a>
					</li>
				))}
				{/* Divider */}
				<div className="divider my-1"></div>
				{/* Create new account option */}
				<li>
					<a onClick={handleCreateAccountClick} className="flex items-center">
						<div className="w-6 h-6 bg-base-300 rounded-full mr-2 flex items-center justify-center text-xs font-bold">
							+
						</div>
						<span>Create new account</span>
					</a>
				</li>
			</ul>

			{/* Create account dialog */}
			{showCreateDialog && (
				<div className="modal modal-open">
					<div className="modal-box bg-base-100">
						<h3 className="font-medium text-lg mb-4">Create New Account</h3>
						<div className="mb-4">
							<label className="block text-sm font-medium mb-1">
								Account Name
							</label>
							<input
								type="text"
								value={newAccountName}
								onChange={(e) => setNewAccountName(e.target.value)}
								className="input input-bordered w-full"
								placeholder="Enter account name"
								autoFocus
							/>
						</div>
						<div className="modal-action">
							<button
								onClick={() => setShowCreateDialog(false)}
								className="btn btn-ghost"
							>
								Cancel
							</button>
							<button onClick={handleCreateAccount} className="btn">
								Create
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AccountSelector;
