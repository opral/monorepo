import type { Message } from "@inlang/sdk"

/**
 * Returns re-export statements for each alias of a message.
 * If no aliases are present, this function returns an empty string.
 *
 * @param message
 */
export function reexportAliases(message: Message) {
	let code = ""

	if (message.alias["default"] && message.id !== message.alias["default"]) {
		code += `
/**
 * Change the reference from the alias \`m.${message.alias["default"]}()\` to \`m.${message.id}()\`:
 * \`\`\`diff
 * - m.${message.alias["default"]}()
 * + m.${message.id}()
 * \`\`\`
 * ---
 * \`${message.alias["default"]}\` is an alias for the message \`${message.id}\`.
 * Referencing aliases instead of the message ID has downsides like:
 *
 * - The alias might be renamed in the future, breaking the code.
 * - Constant naming convention discussions.
 *
 * Read more about aliases and their downsides here 
 * @see inlang.com/link.
 * ---
 * @deprecated reference the message by id \`m.${message.id}()\` instead
 * 
 * @param {Parameters<typeof ${message.id}>} args
 * @returns {ReturnType<typeof ${message.id}>}
 */
export const ${message.alias["default"]} = (...args) => ${message.id}(...args);
`
	}

	return code
}
