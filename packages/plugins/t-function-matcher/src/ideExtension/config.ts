import { parse } from "./messageReferenceMatchers.js";

export const config = {
	messageReferenceMatchers: [
		async (args: { documentText: string }) => {
			return parse(args.documentText);
		},
	],
	extractMessageOptions: [
		{
			callback: (args: { bundleId: string }) => ({
				bundleId: args.bundleId,
				messageReplacement: `{t("${args.bundleId}")}`,
			}),
		},
		{
			callback: (args: { bundleId: string }) => ({
				bundleId: args.bundleId,
				messageReplacement: `t("${args.bundleId}")`,
			}),
		},
		{
			callback: (args: { bundleId: string }) => ({
				bundleId: args.bundleId,
				messageReplacement: args.bundleId,
			}),
		},
	],
	documentSelectors: [
		{
			language: "typescriptreact",
		},
		{
			language: "javascript",
		},
		{
			language: "typescript",
		},
		{
			language: "svelte",
		},
		{
			language: "astro",
		},
		{
			language: "vue",
		},
	],
};
