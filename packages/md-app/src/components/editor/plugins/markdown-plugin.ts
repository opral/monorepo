import { SlateEditor, TText } from "@udecode/plate";
import {
	DeserializeMdOptions,
	MarkdownPlugin,
	MdastNode,
	remarkDefaultElementRules,
	RemarkElementRules,
	remarkPlugin,
	RemarkPluginOptions,
	RemarkTextRules,
	remarkTransformElementChildren,
} from "@udecode/plate-markdown";
import remarkFrontmatter from "remark-frontmatter";

import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type Processor, unified } from "unified";

import { visit } from "unist-util-visit";
// import rehypeStringify from "rehype-stringify";

const lixElementRules: RemarkElementRules = {
	...remarkDefaultElementRules,
	// thematicBreak: {
	// 	transform: (node, options) => {
	// 		debugger;
	// 		return [];
	// 	},
	// },

	// @ts-expect-error -- type not defined here
	yaml: {
		transform: (node: MdastNode, options: RemarkPluginOptions) => {
			const transformed = {
				// caption: [{ text: node.alt } as TText],
				children: [{ text: "" } as TText],
				type: options.editor.getType({ key: "frontmatter" }),
				value: node.value,
			};
			// {
			// 	children: [
			// 		{
			// 			text: node.value,
			// 		},
			// 	],
			// 	type: options.editor.getType({ key: "frontmatter" }),
			// 	yaml: node.value,
			// 	// text: node.value,
			// };
			return transformed;
		},
	},
	sanitized_block_html: {
		transform: (node: MdastNode, options: RemarkPluginOptions) => {
			const transformed = {
				// caption: [{ text: node.alt } as TText],
				children: [{ text: "" } as TText],
				type: options.editor.getType({ key: "sanitized_block_html" }),
				value: node.value,
			};
			return transformed;
		},
	},
	sanitized_inline_html: {
		transform: (node: MdastNode, options: RemarkPluginOptions) => {
			const transformed = {
				// caption: [{ text: node.alt } as TText],
				children: [{ text: "" } as TText],
				type: options.editor.getType({ key: "sanitized_inline_html" }),
				value: node.value,
			};
			return transformed;
		},
	},
	heading: {
		transform: (node, options) => {
			const headingType = {
				1: "h1",
				2: "h2",
				3: "h3",
				4: "h4",
				5: "h5",
				6: "h6",
			}[node.depth ?? 1];

			return {
				children: remarkTransformElementChildren(node, options),
				type: options.editor.getType({ key: headingType }),
			};
		},
	},
};

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

function sanitizeHtml() {
	return (tree: any) => {
		visit(tree, (node, index, parent) => {
			if (node.type === "html") {
				if (parent.type === "root") {
					node.type = "sanitized_block_html";
				} else {
					node.type = "sanitized_inline_html";
				}
			}
		});
	};
}

const deserializeMd = (
	editor: SlateEditor,
	data: string,
	{ memoize, parser, processor }: DeserializeMdOptions = {}
) => {
	const elementRules: RemarkElementRules = {};
	const textRules: RemarkTextRules = {};

	const options = editor.getOptions(MarkdownPlugin);

	Object.assign(elementRules, options.elementRules);
	Object.assign(textRules, options.textRules);

	let tree: any = unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ["yaml", "toml"])
		.use(remarkGfm)
		.use(sanitizeHtml);
	// .use(remarkRehype, { allowDangerousHtml: true })
	// .use(rehypeRaw);

	// if (processor) {
	// 	tree = processor(tree);
	// }
	tree = tree.use(remarkPlugin, {
		editor,
		elementRules,
		indentList: options.indentList,
		textRules,
	} as unknown as RemarkPluginOptions);

	// if (memoize) {
	//   return parseMarkdownBlocks(data, parser).flatMap((token) => {
	//     if (token.type === 'space') {
	//       return {
	//         ...editor.api.create.block(),
	//         _memo: token.raw,
	//       };
	//     }

	//     // TODO: split list items
	//     return tree.processSync(token.raw).result.map((result: any) => {
	//       return {
	//         _memo: token.raw,
	//         ...result,
	//       };
	//     });
	//   });
	// }

	const parsedTree = tree.parse(data);

	console.log(parsedTree);
	const result = tree.processSync(data).result;

	console.log(result);
	return result;
};

export const lixMarkdownPlugin = MarkdownPlugin.extendApi(({ editor }) => {
	const orginalDeserializeMd =
		editor.getApi(MarkdownPlugin).markdown.deserialize;

	const originalSerializeMd = editor.getApi(MarkdownPlugin).markdown.serialize;
	return {
		deserialize: (data: any) => {
			// return orginalDeserializeMd(data, {
			// 	processor: (tree: any) => {
			// 		return tree.use(remarkFrontmatter, ["yaml", "toml"]);
			// 	},
			// });

			return deserializeMd(editor, data);
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
			// return deserializedResult;
		},
		serialize: (nodes: any) => {
			return originalSerializeMd({
				nodes: {
					...nodes,
					sanitized_block_html: {
						// @ts-expect-error --frontmatter not part of MdNodeTypes - TODO check custom type
						serialize: (children, node) => {
							return node.value;
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
						// @ts-expect-error -- TODO remove this after we have update to the last version (> 43.x.x of plate) - which includes this logic
						serialize: (children) => `${children}\n`,
					},
				},
			});
		},
	};
}).configure({
	options: { indentList: true, elementRules: lixElementRules },
});
