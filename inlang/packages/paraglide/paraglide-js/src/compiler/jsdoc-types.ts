import type { InputVariable } from "@inlang/sdk";

export function jsDocBundleFunctionTypes(args: {
	inputs: InputVariable[];
	locales: string[];
}): string {
	const localesUnion = args.locales.map((locale) => `"${locale}"`).join(" | ");

	return `
* @param {${inputsType(args.inputs)}} inputs
* @param {{ locale?: ${localesUnion} }} options
* @returns {LocalizedString}`;
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

	// Deduplicate inputs by name to avoid TypeScript errors with duplicate properties in JSDoc
	const uniqueInputMap = new Map<string, InputVariable>();

	for (const input of inputs) {
		uniqueInputMap.set(input.name, input);
	}

	const uniqueInputs = Array.from(uniqueInputMap.values());

	const inputParams = uniqueInputs
		.map((input) => {
			return `${input.name}: NonNullable<unknown>`;
		})
		.join(", ");
	return `{ ${inputParams} }`;
}
