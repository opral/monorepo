export type LocalStorageSchema = {
	/**
	 * Reflects https://docs.github.com/en/rest/users/users#get-the-authenticated-user
	 */
	user?:
		| {
				isLoggedIn: true;
				username: string;
				email: string;
				avatarUrl?: string;
		  }
		| { isLoggedIn: false };
	/**
	 * Whether to show the machine translation warning.
	 *
	 * See https://github.com/opral/inlang/issues/241
	 */
	showMachineTranslationWarning: boolean;
	isFirstUse: boolean;
	recentProjects: RecentProjectType[];
};

export type RecentProjectType = {
	owner: string;
	repository: string;
	description: string;
	lastOpened: number;
};

/**
 * The default values for the local storage schema.
 */
export const defaultLocalStorage: LocalStorageSchema = {
	showMachineTranslationWarning: true,
	isFirstUse: true,
	recentProjects: [],
};
