/**
 * replaceAll for old Browsers
 *
 * @example replaceAll("abs def abc", "abc", "o")
 */

export function replaceAll(str: string, find: string, replace: string) {
	return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
