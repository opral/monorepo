import type * as vscode from "vscode"

export type IdeExtensionConfig = {
	/**
	 * The message reference matchers.
	 * These are used to find message references in the source code.
	 * The first matcher that returns a match is used.
	 */
	messageReferenceMatchers: Array<(sourceCode: string) => Promise<Array<string>>>
	/**
	 * The extract message options.
	 * These are used to replace the highlighted text when extracting a message.
	 */
	extractMessageOptions: Array<{
		/**
		 * The callback that returns the replacement string.
		 * The first callback that returns a string is used.
		 * @param messageId The message id.
		 * @param messageValue The message value.
		 * @returns The replacement string.
		 * ```ts
		 * {
		 *  callback: (messageId: string, messageValue: string) => `{t("${messageId}")}`,
		 * }
		 * ```
		 */
		callback: (messageId: string, messageValue: string) => string
	}>
	/**
	 * The document selectors.
	 * These are used to determine which documents should be parsed for message references.
	 * @example
	 * ```ts
	 * {
	 * documentSelectors: [
	 * {
	 *  language: "javascript",
	 * },
	 * {
	 *  language: "typescript",
	 * },
	 * {
	 * 	language: "svelte",
	 * },
	 * ```
	 */
	documentSelectors: vscode.DocumentSelector
}
