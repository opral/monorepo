import * as z from "zod"

export const validateIdeExtensionConfig = (config: IdeExtensionConfig | undefined) =>
	ideExtensionSchema.parse(config)

/**
 * The position from where to where the reference can be found.
 */
const positionSchema = z.object({
	start: z.object({
		line: z.number(),
		character: z.number(),
	}),
	end: z.object({
		line: z.number(),
		character: z.number(),
	}),
})

const messageReferenceSchema = z.object({
	messageId: z.string(),
	position: positionSchema,
})

const ideExtensionSchema = z
	.object({
		/**
		 * Defines matchers for message references inside the code.
		 *
		 * @param args represents the data to conduct the search on
		 * @returns a promise with matched message references
		 */
		messageReferenceMatchers: z.array(
			z
				.function()
				.args(z.object({ documentText: z.string() }))
				.returns(z.promise(z.array(messageReferenceSchema))),
		),
		/**
		 * Defines the options to extract messages.
		 */
		extractMessageOptions: z.array(
			z.object({
				/**
				 * Function which is called, when the user finished the message extraction command.
				 *
				 * @param messageId is the message identifier entered by the user
				 * @param selection is the text which was extracted
				 * @returns the code which is inserted into the document
				 */
				callback: z.function().args(z.string(), z.string()).returns(z.string()),
			}),
		),

		/**
		 * An array of VSCode DocumentSelectors.
		 *
		 * The document selectors specify for which files/programming languages
		 * (typescript, svelte, etc.) the extension should be activated.
		 *
		 * See https://code.visualstudio.com/api/references/document-selector
		 */
		// documentSelectors: DocumentSelector[];
	})
	.optional()

export type IdeExtensionConfig = z.TypeOf<typeof ideExtensionSchema>
