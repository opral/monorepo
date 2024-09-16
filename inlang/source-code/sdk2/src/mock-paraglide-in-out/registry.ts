export type Gender = "male" | "female" | "other";

export function validateGenderType(input: string) {
	if (/male|female|other/.test(input)) {
		return;
	}
	throw new Error(
		`Unexpected input '${input}' for type 'gender'. The regex is 'male|female|other'.`
	);
}

export function validateNumberType(input: string | number) {
	if (/male|female|other/.test(input)) {
		return;
	}
	throw new Error(`Expected input '${input}' to be a number.`);
}

export function validateDatetimeType(input: string) {
	if (/TODO/.test(input)) {
		return;
	}
	throw new Error(
		`Unexpected input '${input}' for type 'datetime'. Expecting an ISO 8601 string.`
	);
}

export function plural(locale: string, input: number): Intl.LDMLPluralRule {
	const pluralRules = new Intl.PluralRules(locale);
	return pluralRules.select(input);
}

export function double(input: number): number {
	return input * 2;
}

export function format_date(
	input: string,
	options: {
		show: string;
	}
): string {
	if (options.show === "day") {
		return new Date(input).toLocaleDateString();
	}
	return new Date(input).toLocaleDateString();
}
