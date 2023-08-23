/**
 * The config schema for the ide extension.
 *
 *
 */
//! Exists as manual type for readability and better hover DX.
export type IdeExtensionConfigSchema = {
	/**
	 * Defines matchers for message references inside the code.
	 *
	 * @param args represents the data to conduct the search on
	 * @returns a promise with matched message references
	 */
	messageReferenceMatchers: ((args: { documentText: string }) => Promise<MessageReferenceMatch[]>)[]

	/**
	 * Defines the options to extract messages.
	 */
	extractMessageOptions: {
		/**
		 * Function which is called, when the user finished the message extraction command.
		 *
		 * @param messageId is the message identifier entered by the user
		 * @param selection is the text which was extracted
		 * @returns the code which is inserted into the document
		 */
		callback: (messageId: string, selection: string) => string
	}[]

	/**
	 * An array of VSCode DocumentSelectors.
	 *
	 * The document selectors specify for which files/programming languages
	 * (typescript, svelte, etc.) the extension should be activated.
	 *
	 * See https://code.visualstudio.com/api/references/document-selector
	 */
	documentSelectors?: Array<{
		language?: string
	}>
}

/**
 * The result of a message reference matcher.
 *
 * The result contains the message id and the position
 * from where to where the reference can be found.
 */
export type MessageReferenceMatch = {
	/**
	 * The messages id.
	 */
	messageId: string
	/**
	 * The position from where to where the reference can be found.
	 */
	position: {
		start: { line: number; character: number }
		end: { line: number; character: number }
	}
}
