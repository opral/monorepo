import * as React from "react";
import { useAtom } from "jotai";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogTrigger,
} from "../../components/ui/dialog.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Label } from "../../components/ui/label.tsx";
import { Button } from "../../components/ui/button.tsx";
import { usernameAtom } from "../state.ts";

interface SettingsModalProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}

export function SettingsModal({
	open,
	onOpenChange,
	children,
}: SettingsModalProps) {
	const [username, setUsername] = useAtom(usernameAtom);
	const [inputValue, setInputValue] = React.useState(username);

	React.useEffect(() => {
		setInputValue(username);
	}, [username]);

	const handleSave = () => {
		setUsername(inputValue);
		onOpenChange?.(false);
	};

	const dialogProps = {
		open,
		onOpenChange,
		modal: true, // Ensure modal behavior
	};

	return (
		<Dialog {...dialogProps}>
			{children && <DialogTrigger asChild>{children}</DialogTrigger>}
			<DialogContent
				onPointerDownOutside={(e) => {
					e.preventDefault();
				}}
				className="pointer-events-auto" // Ensure dialog is interactive
			>
				<DialogHeader>
					<DialogTitle>User Settings</DialogTitle>
					<DialogDescription>
						Update your user profile settings here.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-3">
						<Label htmlFor="username">Username</Label>
						<Input
							id="username"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							placeholder="Enter your username"
							autoComplete="off"
							data-1p-ignore
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleSave}>Save changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
