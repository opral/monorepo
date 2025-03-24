import type React from "react";
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { User } from "./user-context";

interface CreateAccountModalProps {
	onClose: () => void;
	onSubmit: (user: Omit<User, "id">) => void;
}

export function CreateAccountModal({
	onClose,
	onSubmit,
}: CreateAccountModalProps) {
	const [name, setName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus the input field when the modal opens
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) return;

		// Generate initials from name
		const initials = name
			.split(" ")
			.map((part) => part[0])
			.join("")
			.toUpperCase()
			.substring(0, 2);

		onSubmit({
			name,
			initials: initials || "U",
		});
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
			<div className="bg-white border rounded-sm w-full max-w-sm p-3">
				<div className="flex justify-between items-center mb-3">
					<h2 className="text-base">Create New Account</h2>
					<button onClick={onClose} className="p-1 hover:bg-gray-100">
						<X className="h-4 w-4" />
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label className="block mb-1 text-sm">Name</label>
						<input
							ref={inputRef}
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full border rounded-sm p-1.5 text-sm"
							placeholder="Enter your name"
							required
						/>
					</div>

					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={onClose}
							className="border rounded-sm px-3 py-1 text-sm"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="border rounded-sm px-3 py-1 bg-gray-200 text-sm"
						>
							Create Account
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
