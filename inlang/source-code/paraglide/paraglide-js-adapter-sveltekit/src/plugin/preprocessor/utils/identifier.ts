/**
 * Returns a unique identifier for a given original name.
 * Used to avoid name collisions when generating code.
 *
 * @param original_name The original name to create an identifier for
 * @returns A unique identifier for the given original name
 */
export function identifier(original_name: string): string {
	return `paraglide_740127592_${original_name}`
}
