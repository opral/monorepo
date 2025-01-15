export type Registry = Record<
	string,
	{
		/** The Type-Restriction that should be added to the argument of the function */
		typeRestriction?: string;
		options: Record<
			string,
			{
				/** If a variable is used to provide a value for this option, it should be of this type */
				typeRestriction?: string;
			}
		>;
	}
>;

export const DEFAULT_REGISTRY: Registry = {
	plural: {
		typeRestriction: "number",
		options: {
			type: { typeRestriction: "string" },
		},
	},

	number: {
		typeRestriction: "number",
		options: {
			type: { typeRestriction: "string" },
		},
	},

	datetime: {
		typeRestriction: "Date",
		options: {},
	},
};

/**
 * Creates the Registry implementation file
 */
export function createRegistry(emitTs: boolean): string {
	if (emitTs) {
		return tsRegistry;
	} else {
		return jsdocRegistry;
	}
}

const jsdocRegistry = `

/**
 * @param {import("./runtime.js").AvailableLocale} locale
 * @param {number} input
 * @param {Intl.PluralRulesOptions} [options]
 * @returns {string}
 */
export function plural(locale, input, options) { 
	return new Intl.PluralRules(locale, options).select(input)
}

/**
 * @param {import("./runtime.js").AvailableLocale} locale
 * @param {number} input
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string}
 */
export function number(locale, input, options) {
	return new Intl.NumberFormat(locale, options).format(input)
}

/**
 * @param {import("./runtime.js").AvailableLocale} locale
 * @param {Date} input
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function datetime(locale, input, options) {
	return new Intl.DateTimeFormat(locale, options).format(input)
}
`;

const tsRegistry = `
export function plural(
	locale: import("./runtime.js").AvailableLocale,
	input: number,
	options: Intl.PluralRulesOptions
): string {
	return new Intl.PluralRules(locale, options).select(input);
}

export function number(
	locale: import("./runtime.js").AvailableLocale,
	input: number,
	options: Intl.NumberFormatOptions
): string {
	return new Intl.NumberFormat(locale, options).format(input);
}

export function datetime(
	locale: import("./runtime.js").AvailableLocale,
	input: Date,
	options: Intl.DateTimeFormatOptions
): string {
	return new Intl.DateTimeFormat(locale, options).format(input);
}
`;
