/**
 * Custom webpack/rspack loader to preserve exact file content with all whitespace.
 *
 * Why this is needed:
 * - The default 'asset/source' type in rspack/webpack strips whitespace and formatting
 * - This causes code examples to lose their indentation and line breaks
 * - By using a custom loader, we can JSON.stringify the content to preserve everything
 *
 * How it works:
 * 1. Receives file content as a Buffer (raw = true)
 * 2. Converts to UTF-8 string
 * 3. JSON.stringifies to escape all special characters and whitespace
 * 4. The CodeSnippet component then JSON.parses to get the original content
 */
export default function loader(content) {
  // Convert Buffer to string
  const stringContent = content.toString("utf-8");

  // Return the JSON stringified string to preserve all whitespace and special characters
  return JSON.stringify(stringContent);
}

// Mark as raw to receive Buffer
export const raw = true;
