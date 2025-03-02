/**
 * Creates a reference to the message.
 *
 * @example
 *   createReference("message", { id: "123" })
 *   -> m.message({ id: "123" })
 */
export const refMessage = (key: string, params: Record<string, string>) => {
	return `m.${key}(${Object.keys(params)
		.map((key) => `"${params[key]}"`)
		.join(", ")})`;
};

export const importExpression = () =>
	`import { m } from "<src>/paraglide/messages.js";`;
