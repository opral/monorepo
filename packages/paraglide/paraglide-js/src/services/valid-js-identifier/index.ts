/*
 * is-var-name | ISC (c) Shinnosuke Watanabe
 * https://github.com/shinnn/is-var-name
 */
export function isValidJsIdentifier(str: string): boolean {
	if (str.trim() !== str) {
		return false
	}

	try {
		new Function(str, "var " + str)
	} catch (_) {
		return false
	}

	return true
}
