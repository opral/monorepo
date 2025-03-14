import { SlateEditor } from "@udecode/plate-core";
import {
	DeserializeMdOptions,
	MarkdownPlugin,
	RemarkElementRules,
	remarkPlugin,
	RemarkPluginOptions,
	RemarkTextRules,
} from "@udecode/plate-markdown";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const sanitizeHtml = function () {
	return (tree: any) => {
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

export const deserializeMd = (
	editor: SlateEditor,
	data: string
	// { memoize, parser, processor }: DeserializeMdOptions = {}
) => {
	const elementRules: RemarkElementRules = {};
	const textRules: RemarkTextRules = {};

	const options = editor.getOptions(MarkdownPlugin);

	Object.assign(elementRules, options.elementRules);
	Object.assign(textRules, options.textRules);

	let mdProcessor: any = unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ["yaml", "toml"])
		.use(remarkGfm)
		.use(sanitizeHtml);
	// .use(remarkRehype, { allowDangerousHtml: true, passThrough: ['']  })
	// .use(rehypeRaw);

	// if (processor) {
	// 	tree = processor(tree);
	// }
	mdProcessor = mdProcessor.use(remarkPlugin, {
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

	const parsedTree = mdProcessor.parse(data);

	// console.log(parsedTree);
	const result = mdProcessor.processSync(data).result;

	console.log({ deserializeMd: result });
	return result;
};