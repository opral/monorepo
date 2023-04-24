export type LocalStorageSchema = {
	/**
	 * Reflects https://docs.github.com/en/rest/users/users#get-the-authenticated-user
	 */
	user?: {
		username: string
		email: string
		avatarUrl: string
	}
	/**
	 * Whether to show the machine translation warning.
	 *
	 * See https://github.com/inlang/inlang/issues/241
	 */
	showMachineTranslationWarning: boolean
}

/**
 * The default values for the local storage schema.
 */
export const defaultLocalStorage: LocalStorageSchema = {
	showMachineTranslationWarning: true,
}
