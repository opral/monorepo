export type CookieStrategy = {
	type: "cookie";
	cookieName: string;
};

export type CustomStrategy = {
	type: "custom";
};

export type Strategy = CookieStrategy | CustomStrategy;

const variableNames = ["type", "cookieName"] as const;

export function createStrategyFile(strategy: Strategy): string {
	let result = ``;

	for (const name of variableNames) {
		result += `export const ${name} = ${JSON.stringify(
			// @ts-expect-error - typescript is not smart enough to know that the name is a valid key of the strategy object
			strategy[name],
			null,
			`\t`
		)}\n`;
	}

	return result;
}
