import type { InlangPlugin } from "@inlang/sdk";
import { parse } from "./messageReferenceMatchers.js";

export const ideExtensionConfig = (): ReturnType<
	Exclude<InlangPlugin["addCustomApi"], undefined>
> => ({
	"app.inlang.ideExtension": {
		messageReferenceMatchers: [
			async (args: { documentText: string }) => {
				return parse(args.documentText);
			},
		],
		extractMessageOptions: [
			{
				callback: (args: { messageId: string }) => ({
					messageId: args.messageId,
					messageReplacement: `{t("${args.messageId}")}`,
				}),
			},
			{
				callback: (args: { messageId: string }) => ({
					messageId: args.messageId,
					messageReplacement: `t("${args.messageId}")`,
				}),
			},
			{
				callback: (args: { messageId: string }) => ({
					messageId: args.messageId,
					messageReplacement: args.messageId,
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
	},
});
