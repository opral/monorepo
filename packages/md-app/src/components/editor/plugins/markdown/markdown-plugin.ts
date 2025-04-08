import { Descendant } from "@udecode/plate";
import { MarkdownPlugin } from "../markdown-plate-fork";

import { deserializeMd } from "./deserializeMd";
import { remarkToPlateElementRules } from "./RemarkToPlateElementRules";
import { EMPTY_DOCUMENT_PROMPT_KEY } from "../../plugins/empty-document-prompt-plugin";

// export function remarkPlugin(
// 	this: Processor<undefined, undefined, undefined, MdastNode>,
// 	options: RemarkPluginOptions
// ) {
// 	const shouldSplitLineBreaks =
// 		options.editor.getOptions(MarkdownPlugin).splitLineBreaks;

// 	const compiler = (node: MdastNode) => {
// 		debugger;
// 	};

// 	(this as any).compiler = compiler;
// }

export const ExtendedMarkdownPlugin = MarkdownPlugin.extendApi(({ editor }) => {
	const originalSerializeMd = editor.getApi(MarkdownPlugin).markdown.serialize;
	return {
		deserialize: (data: any) => {
			// return orginalDeserializeMd(data, {
			// 	processor: (tree: any) => {
			// 		return tree.use(remarkFrontmatter, ["yaml", "toml"]);
			// 	},
			// });

			const deserializedResult = deserializeMd(editor, data);
			// const deserializedResult = orginalDeserializeMd(data, {
			// 	processor: (tree: any) => {
			// 		return (
			// 			tree
			
			// 				// add frontmatter to allow headers containing yaml and toml
			// 				.use(remarkFrontmatter, ["yaml", "toml"])
			// 				.use(remarkGfm)
			// 				// add rehype and rehype raw ot parse html
			// 				.use(remarkRehype, { allowDangerousHtml: true })
			// 				.use(rehypeRaw)
			// 			// .use(rehypeStringify)
			// 		);
			// 	},
			// });
			console.log({ deserializedResult });
			
			// Insert the empty document prompt element after the first heading
			// if we have at least one node
			if (deserializedResult.length > 0) {
				// Find the first heading element
				const firstHeadingIndex = deserializedResult.findIndex(
					(node) => node.type && node.type.startsWith('h')
				);

				// If we found a heading, insert the prompt after it
				if (firstHeadingIndex !== -1) {
					const emptyPromptElement = {
						type: EMPTY_DOCUMENT_PROMPT_KEY,
						children: [{ text: '' }],
					};
					
					// Insert after the first heading
					deserializedResult.splice(firstHeadingIndex + 1, 0, emptyPromptElement);
				}
			}
			
			return deserializedResult;
		},
		serialize: (value: Descendant[]) => {
			let serializenResult = originalSerializeMd({
				value,
				nodes: {
					// @ts-expect-error --frontmatter not part of MdNodeTypes - TODO check custom type
					sanitized_block_html: {
						// @ts-expect-error --frontmatter not part of MdNodeTypes - TODO check custom type
						serialize: (children, node) => {
							return node.value + "\n\n";
						},
					},
					sanitized_inline_html: {
						// @ts-expect-error --frontmatter not part of MdNodeTypes - TODO check custom type
						serialize: (children, node) => {
							return node.value;
						},
					},
					frontmatter: {
						// @ts-expect-error --frontmatter not part of MdNodeTypes - TODO check custom type
						serialize: (children, node) => {
							return "---\n" + node.value + "\n---\n";
						},
					},
					// NOTE: Empty blocks get not serialized correctly - to fix this we mark the code_block as void
					// - this is still an issue in 46.0.0
					code_block: {
						serialize: (children, node) => {
							return `\n\`\`\`${node.lang || ""}\n${children}\`\`\`\n`;
						},
						isVoid: true,
					},
					code_line: {
						// TODO remove this after we have update to the last version (> 43.x.x of plate) - which includes this logic
						serialize: (children) => `${children}\n`,
					},
					// Don't serialize the empty-document-prompt element to markdown
					[EMPTY_DOCUMENT_PROMPT_KEY]: {
						serialize: () => "",
					}
				},
			});
			// XXX removes the extra <br> added by plate at the end of a paragraph
			serializenResult = serializenResult.endsWith("<br>")
				? serializenResult.slice(0, -4) + "\n"
				: serializenResult;

			// console.log("serializenResult", serializenResult);

			return serializenResult;
		},
	};
}).configure({
	options: { indentList: true, elementRules: remarkToPlateElementRules },
});