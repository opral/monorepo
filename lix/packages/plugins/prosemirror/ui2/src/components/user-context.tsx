import { createContext, useContext, useState, type ReactNode } from "react";

export interface User {
	id: string;
	name: string;
	initials: string;
}

interface UserContextType {
	users: User[];
	currentUser: User;
	setUsers: (users: User[]) => void;
	setCurrentUser: (user: User) => void;
	addUser: (user: Omit<User, "id">) => void;
}

const initialUsers: User[] = [
	{
		id: "user-1",
		name: "Anonymous Clock",
		initials: "AC",
	},
];

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
	const [users, setUsers] = useState<User[]>(initialUsers);
	const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);

	const addUser = (newUser: Omit<User, "id">) => {
		const id = `user-${users.length + 1}`;
		const user = { ...newUser, id };

		setUsers((prev) => [...prev, user]);
		setCurrentUser(user);
	};

	return (
		<UserContext.Provider
			value={{
				users,
				currentUser,
				setUsers,
				setCurrentUser,
				addUser,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
}
