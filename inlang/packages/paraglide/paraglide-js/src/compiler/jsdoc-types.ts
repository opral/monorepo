import type { InputVariable } from "@inlang/sdk";

export function jsDocBundleFunctionTypes(args: {
	inputs: InputVariable[];
	locales: string[];
}): string {
	const inputParams = args.inputs
		.map((input) => {
			return `${input.name}: NonNullable<unknown>`;
		})
		.join(", ");

	const localesUnion = args.locales.map((locale) => `"${locale}"`).join(" | ");

	return `
* @param {{ ${inputParams} }} inputs
* @param {{ locale?: ${localesUnion} }} options
* @returns {string}`;
}

export function jsDocMessageFunctionTypes(args: {
	inputs: InputVariable[];
}): string {
	const inputParams = args.inputs
		.map((input) => {
			return `${input.name}: NonNullable<unknown>`;
		})
		.join(", ");

	return `/**
* @param {{ ${inputParams} }} i
*/`;
}
