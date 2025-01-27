export type CookieStrategy = {
	type: "cookie";
	cookieName: string;
};

export type CustomStrategy = {
	type: "custom";
};

export type Strategy = CookieStrategy | CustomStrategy;

export function createStrategyFile(strategy: Strategy): string {
	let result = ``;

	for (const key in strategy) {
		result += `export const ${key} = ${JSON.stringify(
			// @ts-expect-error - typescript is not smart enough to know that the key is a valid key of the strategy object
			strategy[key],
			null,
			// beautify the output
			`\t`
		)}\n`;
	}

	return result;
}
