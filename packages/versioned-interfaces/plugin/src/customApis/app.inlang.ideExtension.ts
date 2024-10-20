import { type Static, Type } from "@sinclair/typebox";

/**
 * The result of a message reference matcher.
 *
 * The result contains the message id and the position
 * from where to where the reference can be found.
 */
export const MessageReferenceMatch = Type.Object({
  /**
   * The messages id.
   */
  messageId: Type.String(),
  /**
   * The position from where to where the reference can be found.
   */
  position: Type.Object({
    start: Type.Object({
      line: Type.Number(),
      character: Type.Number(),
    }),
    end: Type.Object({
      line: Type.Number(),
      character: Type.Number(),
    }),
  }),
});

/**
 * The config schema for the ide extension.
 */
export const IdeExtensionConfigSchema = Type.Object({
  /**
   * Defines matchers for message references inside the code.
   *
   * @param args represents the data to conduct the search on
   * @returns a promise with matched message references
   */
  messageReferenceMatchers: Type.Array(
    Type.Function(
      [
        Type.Object({
          documentText: Type.String(),
        }),
      ],
      Type.Promise(Type.Array(MessageReferenceMatch)),
    ),
  ),
  /**
   * Defines the options to extract messages.
   */
  extractMessageOptions: Type.Array(
    Type.Object({
      /**
       * Function which is called, when the user finished the message extraction command.
       *
       * @param messageId is the message identifier entered by the user
       * @param selection is the text which was extracted
       * @returns the code which is inserted into the document
       */
      callback: Type.Function(
        [
          Type.Object({
            messageId: Type.String(),
            selection: Type.String(),
          }),
        ],
        Type.Object({
          messageId: Type.String(),
          messageReplacement: Type.String(),
        }),
      ),
    }),
  ),
  /**
   * An array of Visual Studio Code DocumentSelectors.
   *
   * The document selectors specify for which files/programming languages
   * (typescript, svelte, etc.) the extension should be activated.
   *
   * See https://code.visualstudio.com/api/references/document-selector
   */
  documentSelectors: Type.Optional(
    Type.Array(
      Type.Object({
        language: Type.Optional(Type.String()),
      }),
    ),
  ),
});

export type CustomApiInlangIdeExtension = Static<
  typeof IdeExtensionConfigSchema
>;
