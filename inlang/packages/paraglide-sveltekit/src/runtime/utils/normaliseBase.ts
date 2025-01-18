export type NormalizedBase = `/${string}` | ""
/**
 * Normalises SvelteKit's base path value to always be an absolute path - or an empty string.
 *
 * @param baseValue - The { base } value exported from "$app/paths"
 * @param currentUrl - The current URL of the page
 */
export function normaliseBase(baseValue: string, currentUrl: URL): NormalizedBase {
	if (baseValue === "") return ""
	const absoluteBase = new URL(baseValue, currentUrl).pathname as NormalizedBase
	return (absoluteBase.endsWith("/") ? absoluteBase.slice(0, -1) : absoluteBase) as NormalizedBase
}
