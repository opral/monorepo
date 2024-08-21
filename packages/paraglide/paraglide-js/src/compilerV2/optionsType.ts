import { toStringUnion } from "../services/codegen/string-union.js"

export const optionsType = (args: { languageTags: Iterable<string> }) => {
	return `@param {{ languageTag?: ${toStringUnion(args.languageTags) ?? "undefined"} }} options`
}
