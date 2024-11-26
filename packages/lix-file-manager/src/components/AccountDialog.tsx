import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "../../components/ui/dialog.js";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { useState, useTransition, useCallback, Suspense } from "react";
import { useAtom } from "jotai";
import { activeAccountAtom, accountsAtom, lixAtom } from "../state.js";
import { Avatar, AvatarFallback } from "../../components/ui/avatar.js";
import { Check } from "lucide-react";

interface AccountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
	const [accounts] = useAtom(accountsAtom);
	const [newAccountName, setNewAccountName] = useState("");
	const [activeAccount, setActiveAccount] = useAtom(activeAccountAtom);
	const [lix] = useAtom(lixAtom);
	const [isCreating, setIsCreating] = useState(false);
	const [, startTransition] = useTransition();

	const handleCreateAccount = useCallback(async () => {
		if (!newAccountName.trim() || !lix) return;

		setIsCreating(true);
		try {
			const newAccount = await lix.db
				.insertInto("account")
				.values({
					name: newAccountName.trim(),
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			await new Promise((resolve) => setTimeout(resolve, 0));

			startTransition(() => {
				setNewAccountName("");
				setActiveAccount(newAccount);
			});

			setTimeout(() => onOpenChange(false), 0);
		} catch (error) {
			console.error("Failed to create account:", error);
		} finally {
			setIsCreating(false);
		}
	}, [newAccountName, lix, setActiveAccount, onOpenChange]);

	const handleSwitchAccount = useCallback(
		async (accountId: string) => {
			const account = accounts?.find((a) => a.id === accountId);

			try {
				await new Promise((resolve) => setTimeout(resolve, 0));

				startTransition(() => {
					setActiveAccount(account || null);
				});

				setTimeout(() => onOpenChange(false), 0);
			} catch (error) {
				console.error("Failed to switch account:", error);
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<Suspense fallback={<div>Loading...</div>}>
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold">
							Account Management
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-6 py-4">
						{accounts?.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<p>No accounts found.</p>
								<p className="text-sm">Create your first account below.</p>
							</div>
						) : (
							<Select
								value={activeAccount?.id}
								onValueChange={handleSwitchAccount}
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
									onKeyPress={handleKeyPress}
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
				</Suspense>
			</DialogContent>
		</Dialog>
	);
}
