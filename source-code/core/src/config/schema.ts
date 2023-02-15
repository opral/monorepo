import type * as ast from "../ast/index.js";
import type { $fs, $import } from "./environment-functions/index.js";

/**
 * The environment functions.
 *
 * Read more https://inlang.com/documentation/environment-functions
 */
export type EnvironmentFunctions = {
  $fs: $fs;
  $import: $import;
};

/**
 * The inlang config function.
 *
 * Read more https://inlang.com/documentation/config
 */
export type DefineConfig = (args: EnvironmentFunctions) => Promise<Config>;

/**
 * Inlang config schema.
 *
 * Read more https://inlang.com/documentation/config
 */
export type Config = {
  /**
   * The reference language that other messages are validated against.
   *
   * The languages can be named freely. It's adviceable to follow the IETF BCP 47 language tag scheme.
   * In most cases, the reference lanugage is `en-US` (American English).
   *
   * @see https://www.ietf.org/rfc/bcp/bcp47.txt
   * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
   */
  referenceLanguage: string;
  /**
   * Available languages in this project.
   *
   * The languages can be named freely. It's adviceable to follow the IETF BCP 47 language tag scheme.
   *
   * @see https://www.ietf.org/rfc/bcp/bcp47.txt
   * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
   */
  languages: string[];
  readResources: (args: { config: Config }) => Promise<ast.Resource[]>;
  writeResources: (args: {
    config: Config;
    resources: ast.Resource[];
  }) => Promise<void>;
  /**
   * WARNING: Experimental properties are not required,
   * can change at any time and do not lead to a MAJOR version bump.
   *
   * Read more under https://inlang.com/documentation/breaking-changes
   */
  experimental?: object;

  ideExtension?: {
    /**
     * Defines when a message is referenced.
     */
    inlinePatternMatcher?: (args: {
      /**
       * The (code) text to match against.
       */
      text: string;
    }) => Promise<
      Array<{
        /**
         * The ID of the message.
         */
        id: string;
        /**
         * The position from where to where the pattern should be inlined.
         */
        position: {
          start: { line: number; character: number };
          end: { line: number; character: number };
        };
      }>
    >;

    /**
     * Defines the options to extract messages.
     */
    extractMessageOptions: {
      /**
       * Unique identifier and title of the extraction option.
       */
      id: string,
      /**
       * Function which is called, when the user finished the message extraction command.
       *
       * @param messageId is entered by the user
       * @param selection is the text which was extracted
       * @returns the code which is inserted into the document
       */
      callback: (messageId: string, selection: string) => string;
    }[];

    /**
     * An array of VSCode DocumentSelectors.
     *
     * The document selectors specify for which files/programming languages
     * (typescript, svelte, etc.) the extension should be activated.
     *
     * See https://code.visualstudio.com/api/references/document-selector
     */
    // documentSelectors: DocumentSelector[];
  };
};
