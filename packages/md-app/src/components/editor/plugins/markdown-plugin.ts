import { TText } from "@udecode/plate";
import {
	deserializeMd,
	MarkdownPlugin,
	MdastNode,
	remarkDefaultElementRules,
	RemarkElementRules,
	RemarkPluginOptions,
	remarkTransformElementChildren,
} from "@udecode/plate-markdown";
import remarkFrontmatter from "remark-frontmatter";
import { text } from "stream/consumers";
import { serialize } from "v8";

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

export const lixMarkdownPlugin = MarkdownPlugin.extendApi(({ editor }) => {
	// @ts-expect-error -- type not defined here
	const orginalDeserializeMd = editor.api.markdown.deserialize;
	// @ts-expect-error -- type not defined here
	const originalSerializeMd = editor.api.markdown.serialize;
	return {
		deserialize: (data: any) => {
			// editor.api.markdown.deserialize(data);
			return orginalDeserializeMd(data, {
				processor: (tree: any) => {
					return tree.use(remarkFrontmatter, ["yaml", "toml"]);
				},
			});
		},
		serialize: (nodes: any) => {
			return originalSerializeMd({
				nodes: {
					...nodes,
					frontmatter: {
						serialize: (children, node) => {
							return "---\n" + node.value + "\n---\n";
						},
					},
				},
			});
		},
	};
}).configure({
	options: { indentList: true, elementRules: lixElementRules },
});
