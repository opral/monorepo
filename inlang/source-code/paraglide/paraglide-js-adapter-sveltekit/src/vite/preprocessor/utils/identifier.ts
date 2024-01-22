/**
 * Returns a unique identifier for a given original name.
 * Used to avoid name collisions when generating code.
 *
 * @param original_name The original name to create an identifier for
 * @returns A unique identifier for the given original name
 */
export const identifier = (context: string) => (original_name: string) =>
	`paraglide_740127592_${context}_${original_name}`
