import { escapeForDoubleQuoteString } from "./escape.js"

export function toStringUnion(iterable: Iterable<string>) {
	return [...iterable].map((item) => `"${escapeForDoubleQuoteString(item)}"`).join(" | ")
}
