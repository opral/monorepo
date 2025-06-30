import React, { useState } from "react";
import { createAccount, switchAccount, Account } from "@lix-js/sdk";
import { getInitials } from "../utilities/nameUtils";
import { ChevronDown } from "lucide-react";
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";

const AccountSelector: React.FC = () => {
	const lix = useLix();
	const [isOpen, setIsOpen] = useState(false);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [newAccountName, setNewAccountName] = useState("");

	const allAccounts = useQuery(() => lix.db.selectFrom("account").selectAll());

	const activeAccount = useQueryTakeFirst(() =>
		lix.db.selectFrom("active_account").selectAll(),
	);

	const handleAccountSelect = async (account: Account) => {
		setIsOpen(false);
		await switchAccount({
			lix,
			to: [account],
		});
	};

	const handleCreateAccountClick = () => {
		setIsOpen(false);
		setShowCreateDialog(true);
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
		<div className="w-6 h-6 rounded-full bg-base-300 border border-base-300 flex items-center justify-center text-xs font-bold text-base-content mr-2 flex-shrink-0">
			{getInitials(name)}
		</div>
	);

	// Loading state or display account
	return (
		<div className="relative inline-block">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="btn btn-outline justify-between normal-case"
			>
				<div className="flex items-center">
					{activeAccount ? (
						<>
							<Avatar name={activeAccount.data?.name ?? ""} />
							<span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">
								{activeAccount.data?.name}
							</span>
						</>
					) : (
						<>
							<div className="w-6 h-6 bg-base-300 border border-base-300 rounded-full mr-2 flex items-center justify-center text-xs font-bold flex-shrink-0"></div>
							<span>Loading...</span>
						</>
					)}
				</div>
				<ChevronDown size={16} className="ml-2" />
			</button>

			{isOpen && (
				<div className="absolute top-full right-0 min-w-full w-auto max-w-[200px] bg-white border border-base-300 rounded-b-md shadow-md z-10 max-h-[300px] overflow-y-auto">
					{allAccounts.data?.map((account) => (
						<div
							key={account.id}
							onClick={() => handleAccountSelect(account)}
							className={`p-3 cursor-pointer border-b border-base-200 flex items-center ${
								activeAccount && account.id === activeAccount.data?.id
									? "bg-base-200"
									: "bg-white"
							}`}
						>
							<Avatar name={account.name} />
							<span className="overflow-hidden text-ellipsis whitespace-nowrap">
								{account.name}
							</span>
						</div>
					))}
					{/* Create new account option */}
					<div
						onClick={handleCreateAccountClick}
						className="p-3 cursor-pointer border-t border-base-200 bg-base-100 flex items-center"
					>
						<div className="w-6 h-6 bg-base-200 border border-base-300 rounded-full mr-2 flex items-center justify-center text-xs font-bold">
							+
						</div>
						<span>Create new account</span>
					</div>
				</div>
			)}

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
