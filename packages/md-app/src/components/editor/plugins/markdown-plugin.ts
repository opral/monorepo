import { TText } from "@udecode/plate";
import {
	MarkdownPlugin,
	MdastNode,
	remarkDefaultElementRules,
	RemarkElementRules,
	RemarkPluginOptions,
	remarkTransformElementChildren,
} from "@udecode/plate-markdown";
import remarkFrontmatter from "remark-frontmatter";

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
	
	const orginalDeserializeMd =
		editor.getApi(MarkdownPlugin).markdown.deserialize;

	const originalSerializeMd = editor.getApi(MarkdownPlugin).markdown.serialize;
	return {
		deserialize: (data: any) => {
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
