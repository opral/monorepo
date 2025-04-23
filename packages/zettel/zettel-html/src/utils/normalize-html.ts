/**
 * Normalizes HTML for test comparison:
 * - Removes all whitespace between tags
 * - Removes leading/trailing whitespace
 * - Removes all newlines and tabs
 * - Collapses multiple spaces into one (outside tags)
 * - Removes indentation inside tags
 * - Trims whitespace inside tags (e.g. <span>   foo   </span> -> <span>foo</span>)
 */
export function normalizeHtml(html: string): string {
	return html
		.replace(/>[\s\n\r\t]+</g, "><") // Remove all whitespace between tags
		.replace(/[\n\r\t]/g, "") // Remove all newlines and tabs
		.replace(/\s{2,}/g, " ") // Collapse multiple spaces into one
		.replace(/>\s+</g, "><") // Remove whitespace between tags (again for safety)
		.replace(/>([^<]*)</g, (m, text) => ">" + text.trim() + "<") // Trim inside tags
		.trim();
}

/**
 * Stringifies a value and escapes double quotes for safe embedding in an HTML attribute.
 * @param value The value to stringify.
 * @returns The stringified and escaped value.
 */
export function stringifyJson(value: any): string {
	return JSON.stringify(value).replace(/"/g, "&quot;");
}
