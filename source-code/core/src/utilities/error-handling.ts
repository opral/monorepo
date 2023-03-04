import { inspect } from "./polyfills/util.js";

export const unhandled = (type: never, context?: unknown): never => {
	throw new Error(
		`unhandled case: '${type}'${context ? ` for ${inspect(context, { depth: 99 })}` : ""}`
	);
};
