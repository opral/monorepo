export const optionsType = (args: { languageTags: Iterable<string> }) => {
	return `@param {{ languageTag?: ${
		Array.from(args.languageTags).map(quote).join(" | ") ?? "undefined"
	} }} options`
}

const quote = (str: string) => `"${str}"`
