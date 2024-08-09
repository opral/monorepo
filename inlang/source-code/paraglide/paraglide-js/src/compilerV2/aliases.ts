import type { BundleNested } from "@inlang/sdk2"

/**
 * Returns re-export statements for each alias of a MessageBundle.
 * If no aliases are present, this function returns an empty string.
 *
 * @param bundle
 */
export function reexportAliases(bundle: BundleNested) {
	let code = ""

	if (bundle.alias["default"] && bundle.id !== bundle.alias["default"]) {
		code += `
/**
 * Change the reference from the alias \`m.${bundle.alias["default"]}()\` to \`m.${bundle.id}()\`:
 * \`\`\`diff
 * - m.${bundle.alias["default"]}()
 * + m.${bundle.id}()
 * \`\`\`
 * ---
 * \`${bundle.alias["default"]}\` is an alias for the message \`${bundle.id}\`.
 * Referencing aliases instead of the message ID has downsides like:
 *
 * - The alias might be renamed in the future, breaking the code.
 * - Constant naming convention discussions.
 *
 * Read more about aliases and their downsides here 
 * @see inlang.com/link.
 * ---
 * @deprecated reference the MessageBundle by id \`m.${bundle.id}()\` instead
 * 
 * @param {Parameters<typeof ${bundle.id}>} args
 * @returns {ReturnType<typeof ${bundle.id}>}
 */
export const ${bundle.alias["default"]} = (...args) => ${bundle.id}(...args);
`
	}

	return code
}
