import React, { useState } from "react";
import { lix } from "../state";
import { createAccount, switchAccount, Account } from "@lix-js/sdk";
import { useQuery } from "../hooks/useQuery";

// Helper function to get initials from a name
const getInitials = (name: string): string => {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase();
};

const AccountSelector: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [newAccountName, setNewAccountName] = useState("");

	const [allAccounts] = useQuery(() =>
		lix.db.selectFrom("account").selectAll().execute(),
	);

	const [activeAccount] = useQuery(() =>
		lix.db.selectFrom("active_account").selectAll().executeTakeFirstOrThrow(),
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
		<div
			style={{
				width: "24px",
				height: "24px",
				borderRadius: "50%",
				backgroundColor: "#e0e0e0",
				border: "1px solid #ccc",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: "10px",
				fontWeight: "bold",
				color: "#666",
				marginRight: "8px",
				flexShrink: 0,
			}}
		>
			{getInitials(name)}
		</div>
	);

	// Loading state or display account
	return (
		<div
			className="account-selector"
			style={{ position: "relative", display: "inline-block" }}
		>
			<button
				onClick={() => setIsOpen(!isOpen)}
				style={{
					padding: "8px 12px",
					border: "1px solid #ccc",
					borderRadius: "4px",
					background: "#f9f9f9",
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					minWidth: "120px",
					justifyContent: "space-between",
				}}
			>
				<div style={{ display: "flex", alignItems: "center" }}>
					{activeAccount ? (
						<>
							<Avatar name={activeAccount.name} />
							<span
								style={{
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									maxWidth: "120px",
								}}
							>
								{activeAccount.name}
							</span>
						</>
					) : (
						<>
							<div
								style={{
									width: "24px",
									height: "24px",
									backgroundColor: "#e0e0e0",
									border: "1px solid #ccc",
									borderRadius: "50%",
									marginRight: "8px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "10px",
									fontWeight: "bold",
									flexShrink: 0,
								}}
							></div>
							<span>Loading...</span>
						</>
					)}
				</div>
				<span>▼</span>
			</button>

			{isOpen && (
				<div
					style={{
						position: "absolute",
						top: "100%",
						right: "0", // Right-aligned instead of left
						minWidth: "100%",
						width: "auto",
						maxWidth: "200px",
						background: "white",
						border: "1px solid #ccc",
						borderRadius: "0 0 4px 4px",
						boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
						zIndex: 10,
						maxHeight: "300px",
						overflowY: "auto",
					}}
				>
					{allAccounts?.map((account) => (
						<div
							key={account.id}
							onClick={() => handleAccountSelect(account)}
							style={{
								padding: "8px 12px",
								cursor: "pointer",
								borderBottom: "1px solid #eee",
								backgroundColor:
									activeAccount && account.id === activeAccount.id
										? "#f5f5f5"
										: "white",
								display: "flex",
								alignItems: "center",
							}}
						>
							<Avatar name={account.name} />
							<span
								style={{
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{account.name}
							</span>
						</div>
					))}
					{/* Create new account option */}
					<div
						onClick={handleCreateAccountClick}
						style={{
							padding: "8px 12px",
							cursor: "pointer",
							borderTop: "1px solid #eee",
							backgroundColor: "#f9f9f9",
							display: "flex",
							alignItems: "center",
						}}
					>
						<div
							style={{
								width: "24px",
								height: "24px",
								borderRadius: "50%",
								backgroundColor: "#e0e0e0",
								border: "1px solid #ccc",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "10px",
								fontWeight: "bold",
								marginRight: "8px",
								flexShrink: 0,
							}}
						>
							+
						</div>
						<span
							style={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Create new account
						</span>
					</div>
				</div>
			)}

			{/* Create Account Dialog */}
			{showCreateDialog && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 100,
					}}
				>
					<div
						style={{
							backgroundColor: "white",
							padding: "20px",
							width: "280px",
							boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
							borderRadius:
								"4px" /* Small border radius to match other UI elements */,
						}}
					>
						<h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>
							Create New Account
						</h3>
						<input
							type="text"
							placeholder="Enter account name"
							value={newAccountName}
							onChange={(e) => setNewAccountName(e.target.value)}
							style={{
								width: "100%",
								padding: "8px 12px",
								border: "1px solid #ccc",
								borderRadius: "4px",
								marginBottom: "16px",
								fontSize: "14px",
								boxSizing:
									"border-box" /* This ensures padding is included in width */,
							}}
							autoFocus
						/>
						<div
							style={{
								display: "flex",
								justifyContent: "flex-end",
								gap: "8px",
							}}
						>
							<button
								onClick={() => {
									setShowCreateDialog(false);
									setNewAccountName("");
								}}
								style={{
									padding: "8px 12px",
									border: "1px solid #ccc",
									borderRadius: "4px",
									background: "#f9f9f9",
									cursor: "pointer",
								}}
							>
								Cancel
							</button>
							<button
								onClick={handleCreateAccount}
								disabled={!newAccountName.trim()}
								style={{
									padding: "8px 12px",
									border: "1px solid #ccc",
									borderRadius: "4px",
									background: "#f5f5f5",
									color: "#333",
									cursor: !newAccountName.trim() ? "not-allowed" : "pointer",
									opacity: !newAccountName.trim() ? 0.7 : 1,
								}}
							>
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
