// Basic structure for a position in the document
interface Position {
	line: number;
	character: number;
}

// Basic structure for a message reference match
interface MessageReferenceMatch {
	bundleId: string;
	position: {
		start: Position;
		end: Position;
	};
}

// Main IDE extension configuration schema
interface IdeExtensionConfigSchema {
	/**
	 * Defines matchers for message references inside the code.
	 *
	 * @param args - Represents the data to conduct the search on.
	 * @returns A promise with matched message references.
	 */
	messageReferenceMatchers: Array<
		(args: { documentText: string }) => Promise<MessageReferenceMatch[]>
	>;

	/**
	 * Defines options to extract messages.
	 */
	extractMessageOptions: Array<{
		/**
		 * Function which is called when the user finishes the message extraction command.
		 *
		 * @param args - Contains messageId and selection.
		 * @returns The code which is inserted into the document.
		 */
		callback: (args: { bundleId: string; selection: string }) => {
			bundleId: string;
			messageReplacement: string;
		};
	}>;

	/**
	 * An array of Visual Studio Code DocumentSelectors.
	 *
	 * The document selectors specify for which files/programming languages
	 * (typescript, svelte, etc.) the extension should be activated.
	 *
	 * See https://code.visualstudio.com/api/references/document-selector
	 */
	documentSelectors?: Array<{ language?: string }>;
}

// Export the type for external use
export type IdeExtensionConfig = IdeExtensionConfigSchema;
