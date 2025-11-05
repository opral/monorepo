// @ts-nocheck

import { parsePattern } from "./parsePattern.js";

export const parseMessage = (args: {
	key: string;
	value: string;
	languageTag: LanguageTag;
}): Message => {
	return {
		id: args.key,
		alias: {},
		selectors: [],
		variants: [
			{
				languageTag: args.languageTag,
				match: [],
				pattern: parsePattern(args.value),
			},
		],
	};
};
