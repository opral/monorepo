
// import { Descendant } from "@udecode/plate";
import { MarkdownPlugin } from "../markdown-plate-fork-new";

// import { deserializeMd } from "./deserializeMd";
// import { remarkToPlateElementRules } from "./RemarkToPlateElementRules";

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


  import { SuggestionPlugin } from '@udecode/plate-suggestion/react';
  import remarkGfm from 'remark-gfm';
  import remarkMdx from 'remark-mdx';
import { sanatizeUnknownNodeStructuresInTree } from "./sanitizeUnsupported";
import { visit } from "unist-util-visit";

const sanitizeHtml = function () {
	return (tree: any, file: any) => {
		visit(tree, (node, index, parent) => {
			// don't sanitize <br> tags: remark never concats them and conversion to \n happens on ui layer
			if (node.type === "html" && node.value !== "<br>") {
				if (parent.type === "root") {
					node.type = "sanitized_block_html";
				} else {
					node.type = "sanitized_inline_html";
				}
			}
		});
	};
};

export const ExtendedMarkdownPlugin = MarkdownPlugin.configure({
	options: {
		disallowedNodes: [SuggestionPlugin.key],
		remarkPlugins: [
			remarkGfm,
			// sanatizeUnknownNodeStructuresInTree,
			sanitizeHtml,
		],
		nodes: {
			sanitized_block_html: {
				serialize: (node) => {
					return {
						type: "html",
						value: node.value,
					};
				},
				deserialize(mdastNode) {
					return mdastNode;
				},
			},
			sanitized_inline_html: {
				serialize: (node) => {
					return {
						type: "html",
						value: node.value,
					};
				},
				deserialize(mdastNode) {
					return mdastNode;
				},
			},
			sanitized_block: {
				// @ts-expect-error --frontmatter not part of MdNodeTypes - TODO check custom type
				serialize: (node, options) => {
					return {
						type: "html",
						value: node.value,
					};
				},
				deserialize(mdastNode, deco, options) {
					return mdastNode;
				},
			},
			frontmatter: {
				// @ts-expect-error --frontmatter not part of MdNodeTypes - TODO check custom type
				serialize: (node, options) => {
					return {
						type: "html",
						value: node.value,
					};
				},
				deserialize(mdastNode, deco, options) {
					return mdastNode;
				},
			},
		},
	},
});

/*export const ExtendedMarkdownPlugin = MarkdownPlugin.extendApi(({ editor }) => {
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
					sanitized_block: {
						// @ts-expect-error --frontmatter not part of MdNodeTypes - TODO check custom type
						serialize: (children, node) => {
							return "\n" + node.value + "\n";
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
				},
			});
			// XXX removes the extra <br> added by plate at the end of a paragraph
			serializenResult = serializenResult.endsWith("<br>")
				? serializenResult.slice(0, -4) + "\n"
				: serializenResult;

			console.log("serializenResult", serializenResult);

			return serializenResult;
		},
	};
}).configure({
	// options: { indentList: true, elementRules: remarkToPlateElementRules },
});
*/