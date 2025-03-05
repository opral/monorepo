/**
 * Creates a reference to the message.
 *
 * @example
 *   createReference("message", { id: "123" })
 *   -> m.message({ id: "123" })
 */
export const refMessage = (key: string, params?: Record<string, string>) => {
	return `m.${key}(${params ? JSON.stringify(params) : ""})`;
};

export const importExpression = () =>
	`import { m } from "<src>/paraglide/messages.js";`;
