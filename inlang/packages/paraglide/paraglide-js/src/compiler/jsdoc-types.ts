import type { InputVariable } from "@inlang/sdk";

export function jsDocBundleFunctionTypes(args: {
	inputs: InputVariable[];
	locales: string[];
}): string {
	const localesUnion = args.locales.map((locale) => `"${locale}"`).join(" | ");

	return `
* @param {${inputsType(args.inputs)}} inputs
* @param {{ locale?: ${localesUnion} }} options
* @returns {string}`;
}

/**
 * Returns the types for the input variables.
 *
 * @example
 *   const inputs = [{ name: "age" }]
 *   inputsType(inputs)
 *   >> "{ age: NonNullable<unknown> }"
 */
export function inputsType(inputs: InputVariable[]): string {
	if (inputs.length === 0) {
		return "{}";
	}
	const inputParams = inputs
		.map((input) => {
			return `${input.name}: NonNullable<unknown>`;
		})
		.join(", ");
	return `{ ${inputParams} }`;
}
