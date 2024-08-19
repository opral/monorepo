import type { BundleNested } from "@inlang/sdk2"

/**
 * Returns re-export statements for each alias of a MessageBundle.
 * If no aliases are present, this function returns an empty string.
 *
 * @param bundle
 */
export function reexportAliases(bundle: BundleNested) {
	const aliases = Object.values(bundle.alias)
	if (aliases.length > 1) throw new Error("Only one alias is allowed per bundle") // really?
	const alias = aliases[0]
	if (!alias || alias === bundle.id) return ""

	return `/**
 * Change the reference from the alias \`m.${bundle.alias["default"]}()\` to \`m.${bundle.id}()\`:
 * \`\`\`diff
 * - m.${alias}()
 * + m.${bundle.id}()
 * \`\`\`
 * ---
 * \`${alias}\` is an alias for the message \`${bundle.id}\`.
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
export const ${alias} = (...args) => ${bundle.id}(...args);
`
}
