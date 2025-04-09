import { parse } from "./messageReferenceMatchers.js";
import transformBundleId from "./utils/transformBundleId.js";

export const config = {
	messageReferenceMatchers: [
		async (args: { documentText: string }) => {
			return parse(args.documentText);
		},
	],
	extractMessageOptions: [
		{
			callback: (args: { bundleId: string }) => {
				const bundleId = transformBundleId(args.bundleId);
				return {
					bundleId,
					messageReplacement: `{m.${bundleId}()}`,
				};
			},
		},
		{
			callback: (args: { bundleId: string }) => {
				const bundleId = transformBundleId(args.bundleId);
				return {
					bundleId,
					messageReplacement: `m.${bundleId}()`,
				};
			},
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
