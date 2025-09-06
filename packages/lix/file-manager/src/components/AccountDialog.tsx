import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog.js";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { useState, useCallback, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useAtom } from "jotai";
import {
	activeAccountAtom,
	accountsAtom,
	lixAtom,
	switchActiveAccount,
} from "../state.ts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.js";
import { Check } from "lucide-react";

interface AccountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-[425px]"
				aria-describedby="account-dialog-description"
			>
				<div id="account-dialog-description" className="sr-only">
					Manage your accounts and continue anonymously
				</div>
				<Suspense
					fallback={<div className="py-8 text-center">Loading accounts...</div>}
				>
					<ErrorBoundary fallback={<div>Something went wrong</div>}>
						<AccountContent onOpenChange={onOpenChange} />
					</ErrorBoundary>
				</Suspense>
			</DialogContent>
		</Dialog>
	);
}

function AccountContent({
	onOpenChange,
}: {
	onOpenChange: (open: boolean) => void;
}) {
	const [accounts] = useAtom(accountsAtom);
	const [newAccountName, setNewAccountName] = useState("");
	const [activeAccount, setActiveAccount] = useAtom(activeAccountAtom);
	const [lix] = useAtom(lixAtom);
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCreateAccount = useCallback(async () => {
		if (!newAccountName.trim() || !lix) return;

		try {
			setError(null);
			setIsCreating(true);
			const newAccount = await lix.db
				.insertInto("account")
				.values({
					name: newAccountName.trim(),
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			setNewAccountName("");

			await switchActiveAccount(lix, newAccount);
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to create account:", error);
			setError("Failed to create account. Please try again.");
		} finally {
			setIsCreating(false);
		}
	}, [newAccountName, lix, setActiveAccount, onOpenChange]);

	const handleSwitchAccount = useCallback(
		async (accountId: string) => {
			const account = accounts?.find((a) => a.id === accountId);
			if (!account) return;

			try {
				setIsCreating(true);
				await switchActiveAccount(lix, account);
				onOpenChange(false);
			} catch (error) {
				console.error("Failed to switch account:", error);
				setError("Failed to switch account. Please try again.");
			} finally {
				setIsCreating(false);
			}
		},
		[accounts, setActiveAccount, onOpenChange]
	);

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && newAccountName.trim()) {
			handleCreateAccount();
		}
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle className="text-xl font-semibold">
					Account Management
				</DialogTitle>
			</DialogHeader>

			<div className="space-y-6 py-4">
				{accounts?.length > 0 && (
					<Select
						value={activeAccount?.id}
						onValueChange={handleSwitchAccount}
						disabled={isCreating}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select an account">
								{activeAccount && (
									<div className="flex items-center gap-3">
										<Avatar className="h-6 w-6">
											<AvatarFallback className="bg-primary/10 text-sm">
												{activeAccount.name.substring(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<span>{activeAccount.name}</span>
									</div>
								)}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{accounts?.map((account) => (
								<SelectItem
									key={account.id}
									value={account.id}
									className="p-2 [&>span:first-child]:hidden"
								>
									<div className="flex items-center gap-3">
										<Avatar className="h-6 w-6">
											<AvatarFallback className="bg-primary/10 text-sm">
												{account.name.substring(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<span>{account.name}</span>
										{account.id === activeAccount?.id && (
											<Check className="h-4 w-4 ml-auto opacity-50" />
										)}
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				<div className="space-y-2 pt-4 border-t">
					<h3 className="text-sm font-medium text-muted-foreground">
						Create new account
					</h3>
					<div className="flex items-center gap-3">
						<Input
							placeholder="Enter account name"
							value={newAccountName}
							onChange={(e) => setNewAccountName(e.target.value)}
							onKeyDown={handleKeyPress}
							className="flex-1 h-9"
						/>
						<Button
							onClick={handleCreateAccount}
							disabled={!newAccountName.trim() || isCreating}
							className="h-9 px-4"
						>
							{isCreating ? "Creating..." : "Create"}
						</Button>
					</div>
				</div>
			</div>

			<DialogFooter>
				<Button variant="outline" onClick={() => onOpenChange(false)}>
					Close
				</Button>
			</DialogFooter>

			{error && (
				<div className="text-destructive text-sm mt-2 text-center">{error}</div>
			)}
		</>
	);
}
