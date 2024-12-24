import type { InputVariable } from "@inlang/sdk";

export function jsDocBundleComment(args: {
	inputs: InputVariable[];
	locales: string[];
}): string {
	const inputParams = args.inputs
		.map((input) => {
			return `${input.name}: NonNullable<unknown>`;
		})
		.join(", ");

	const localesUnion = args.locales.map((locale) => `"${locale}"`).join(" | ");

	return `/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. \`en.json\`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
*
* @param {{ ${inputParams} }} inputs
* @param {{ locale?: ${localesUnion}, languageTag?: ${localesUnion} }} options
*/`;
}

export function jsDocMessageComment(args: { inputs: InputVariable[] }): string {
	const inputParams = args.inputs
		.map((input) => {
			return `${input.name}: NonNullable<unknown>`;
		})
		.join(", ");

	return `/**
* @param {{ ${inputParams} }} i
*/`;
}
