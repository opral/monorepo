/**
 * --------------------------------
 * This index file exports code that is supposed
 * to be used outside of this directory.
 * --------------------------------
 */

export { parseMarkdown, RequiredFrontmatter } from "./parseMarkdown.js";
export { Markdown } from "./Markdown.jsx";
export {
  /**
   * Use z(od) to extend the required frontmatter schema.
   *
   * @example
   *  const FrontmatterSchema = RequiredSchema.extend({
   *      example: z.string()
   *  })
   */
  z,
} from "zod";
