import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { CreateAccountModal } from "./create-account-modal";
import { useUser } from "./user-context";
import { Avatar } from "./ui/avatar";

export function UserAccountDropdown() {
	const { users, currentUser, setCurrentUser, addUser } = useUser();
	const [isOpen, setIsOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const selectUser = (user: typeof currentUser) => {
		setCurrentUser(user);
		setIsOpen(false);
	};

	const openCreateModal = () => {
		setIsOpen(false);
		setIsCreateModalOpen(true);
	};

	const handleCreateAccount = (newUser: Omit<typeof currentUser, "id">) => {
		addUser(newUser);
		setIsCreateModalOpen(false);
	};

	return (
		<>
			<div className="relative" ref={dropdownRef}>
				{/* Main button */}
				<button
					className="flex items-center gap-2 border border-gray-200 rounded-md px-2 py-1 min-w-[140px]"
					onClick={toggleDropdown}
				>
					<Avatar
						initials={currentUser.initials}
						size="sm"
						className="shrink-0"
					/>
					<span className="truncate text-sm">{currentUser.name}</span>
					<ChevronDown className="h-3 w-3 ml-auto" />
				</button>

				{/* Dropdown menu */}
				{isOpen && (
					<div className="absolute right-0 top-full mt-1 w-full min-w-[160px] bg-white border border-gray-200 rounded-md z-10">
						{users.map((user) => (
							<button
								key={user.id}
								className="flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-gray-100 text-sm"
								onClick={() => selectUser(user)}
							>
								<Avatar
									initials={user.initials}
									size="sm"
									className="shrink-0"
								/>
								<span>{user.name}</span>
							</button>
						))}
						<button
							className="flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-gray-100 border-t border-gray-200 text-sm"
							onClick={openCreateModal}
						>
							<div className="bg-gray-300 rounded-full h-6 w-6 flex items-center justify-center text-xs shrink-0">
								+
							</div>
							<span>Create new account...</span>
						</button>
					</div>
				)}
			</div>

			{isCreateModalOpen && (
				<CreateAccountModal
					onClose={() => setIsCreateModalOpen(false)}
					onSubmit={handleCreateAccount}
				/>
			)}
		</>
	);
}
