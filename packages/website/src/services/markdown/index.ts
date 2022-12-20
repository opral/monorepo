/**
 * --------------------------------
 * This index file exports code that is supposed
 * to be used outside of this directory.
 * --------------------------------
 */

export { parseMarkdown, RequiredFrontmatter } from "./logic.js";
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
