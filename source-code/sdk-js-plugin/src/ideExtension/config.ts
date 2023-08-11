import type { InlangConfig } from "@inlang/core/config"

// TODO: import type from ide-extension package
export const ideExtensionDefaultConfig: InlangConfig["ideExtension"] = {
	messageReferenceMatchers: [
		async (args) => {
			const regex = /(?<!\w){?i\(['"](?<messageId>\S+)['"]\)}?/gm
			const str = args.documentText
			let match
			const result = []

			while ((match = regex.exec(str)) !== null) {
				const startLine = (str.slice(0, Math.max(0, match.index)).match(/\n/g) || []).length + 1
				const startPos = match.index - str.lastIndexOf("\n", match.index - 1)
				const endPos =
					match.index + match[0].length - str.lastIndexOf("\n", match.index + match[0].length - 1)
				const endLine =
					(str.slice(0, Math.max(0, match.index + match[0].length)).match(/\n/g) || []).length + 1

				if (match.groups && "messageId" in match.groups) {
					result.push({
						messageId: match.groups["messageId"]!,
						position: {
							start: {
								line: startLine,
								character: startPos,
							},
							end: {
								line: endLine,
								character: endPos,
							},
						},
					})
				}
			}
			return result
		},
	],
	extractMessageOptions: [
		{
			callback: (messageId) => `{i("${messageId}")}`,
		},
	],
	documentSelectors: [
		{
			language: "javascript",
		},
		{
			language: "typescript",
		},
		{
			language: "svelte",
		},
	],
}

//* Prep for using chevrotain after build step issues have been resolved
// const ideExtensionDefaultConfig: InlangConfig["ideExtension"] = {
// 	messageReferenceMatchers: [
// 		async (args) => {
// 			return messageReferenceMatcher(args.documentText)
// 		},
// 	],
// 	extractMessageOptions: [
// 		{
// 			callback: (messageId) => `{i("${messageId}")}`,
// 		},
// 	],
// 	documentSelectors: [
// 		{
// 			language: "javascript",
// 		},
// 		{
// 			language: "typescript",
// 		},
// 		{
// 			language: "svelte",
// 		},
// 	],
// }
