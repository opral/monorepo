import { TText } from "@udecode/plate";
import { MdastNode, remarkDefaultElementRules, RemarkElementRules, RemarkPluginOptions, remarkTransformElementChildren } from "@udecode/plate-markdown";

/**
 * Transform function from remark's mdast to plate elements
 */
export const remarkToPlateElementRules: RemarkElementRules = {
	...remarkDefaultElementRules,

	// @ts-expect-error -- yaml type not defined here
	yaml: {
		transform: (node: MdastNode, options: RemarkPluginOptions) => {
			const transformed = {
				// caption: [{ text: node.alt } as TText],
				children: [{ text: "" } as TText],
				type: options.editor.getType({ key: "frontmatter" }),
				value: node.value,
			};
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
			console.log("sanitized_block_html.transform");
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
			console.log("sanitized_inline_html.transform");
			return transformed;
		},
	},
	sanitized_block: {
		transform: (node: MdastNode, options: RemarkPluginOptions) => {
			const transformed = {
				// caption: [{ text: node.alt } as TText],
				children: [{ text: "" } as TText],
				type: options.editor.getType({ key: "sanitized_block" }),
				value: (node as any).value,
			};
			console.log("sanitized_block.transform");
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