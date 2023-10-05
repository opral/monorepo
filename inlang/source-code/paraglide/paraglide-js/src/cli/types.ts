import type { Message, ProjectSettings } from "@inlang/sdk"

/**
 * A compile function takes a list of messages and project settings and returns
 * a map of file names to file contents.
 *
 *   - `index.js` is the entry point for the library and must therefore
 *      always be provided.
 *
 * @example
 *   const output = compile({ messages, settings })
 *   console.log(output)
 *   >> { "index.js": "...", "messages.js": "...", "runtime.js": "..." }
 */
export type CompileFunction = (args: {
	messages: Readonly<Message[]>
	settings: ProjectSettings
}) => Record<string, string>
