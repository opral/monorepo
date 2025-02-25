import type {
	MdElementType,
	MdLeafType,
	MdNodeType,
} from "@udecode/plate-markdown";
import {
	type SerializeMdOptions,
	serializeMdNode,
} from "@udecode/plate-markdown";



// NOTE - this file is closely related to the parseMdBlocks.ts file in the lix markdown plugin
// XXX - if you change the parsing here make sure you also update the plugin

const isLeafNode = (node: MdElementType | MdLeafType): node is MdLeafType => {
	return typeof (node as MdLeafType).text === "string";
};

const withIdComment = (node: MdNodeType, content: string) => {
	if (node.id && content === "\n<br>\n") {
		return `<!-- id: ${node.id} --><br>\n`;
	}
	return node.id ? `<!-- id: ${node.id} -->${content}` : content;
};

/**
 * takes the default serialize implementation and adds id comments to the serialized markdown
 *
 * inspired by https://github.com/udecode/plate/blob/main/packages/markdown/src/lib/serializer/defaultSerializeMdNodesOptions.ts
 */
export const idEnrichedSerializeMdNodesOptions: SerializeMdOptions["nodes"] = {
	a: {
		type: "a",
		serialize: (children, node) => `[${children}](${node.url || ""})`,
	},
	blockquote: {
		type: "blockquote",
		serialize: (children, node) => withIdComment(node, `\n> ${children}\n`),
	},
	bold: { isLeaf: true, type: "bold" },
	code: { isLeaf: true, type: "code" },
	code_block: {
		type: "code_block",
		serialize: (children, node) =>
			withIdComment(
				node,
				`\n\`\`\`${node.language || ""}\n${children}\n\`\`\`\n`
			),
	},
	h1: {
		type: "h1",
		serialize: (children, node) => withIdComment(node, `\n# ${children}\n`),
	},
	h2: {
		type: "h2",
		serialize: (children, node) => withIdComment(node, `\n## ${children}\n`),
	},
	h3: {
		type: "h3",
		serialize: (children, node) => withIdComment(node, `\n### ${children}\n`),
	},
	h4: {
		type: "h4",
		serialize: (children, node) => withIdComment(node, `\n#### ${children}\n`),
	},
	h5: {
		type: "h5",
		serialize: (children, node) => withIdComment(node, `\n##### ${children}\n`),
	},
	h6: {
		type: "h6",
		serialize: (children, node) =>
			withIdComment(node, `\n###### ${children}\n`),
	},
	hr: { isVoid: true, type: "hr", serialize: () => "\n---\n" },
	img: {
		isVoid: true,
		type: "img",
		serialize: (_, node, opts) => {
			const caption =
				node.caption?.map((c) => serializeMdNode(c, opts)).join("") ?? "";
			return withIdComment(node, `\n![${caption}](${node.url || ""})\n`);
		},
	},
	italic: { isLeaf: true, type: "italic" },
	li: {
		type: "li",
		serialize: (children, node, { listDepth = 0, nodes }) => {
			const isOL = node && node.parent?.type === nodes.ol.type;
			const spacer = " ".repeat(listDepth * (isOL ? 3 : 2));
			return withIdComment(node, `\n${spacer}${isOL ? "1." : "-"} ${children}`);
		},
	},
	ol: {
		type: "ol",
		serialize: (children, node, { listDepth }) =>
			withIdComment(node, `${children}${listDepth === 0 ? "\n" : ""}`),
	},
	p: {
		type: "p",
		serialize: (children, node, { ulListStyleTypes = [] }) => {
			const listStyleType = node.listStyleType;

			if (listStyleType) {
				let pre = "";

				// Decrement indent for indent lists
				const listDepth = node.indent ? node.indent - 1 : 0;

				pre += "   ".repeat(listDepth);

				const listStart = node.listStart ?? 1;

				const isOL = !ulListStyleTypes.includes(listStyleType);
				const treatAsLeaf =
					node.children.length === 1 && isLeafNode(node.children[0]);

				// https://github.com/remarkjs/remark-react/issues/65
				if (isOL && listDepth > 0) {
					pre += " ";
				}

				// TODO: support all styles
				// TODO check if we should add th id to those as well?
				return `${pre}${isOL ? listStart + "." : "-"} ${children}${treatAsLeaf ? "\n" : ""}`;
			}

			return withIdComment(node, `\n${children}\n`);
		},
	},
	strikethrough: { isLeaf: true, type: "strikethrough" },
	ul: {
		type: "ul",
		serialize: (children, node, { listDepth }) =>
			withIdComment(node, `${children}${listDepth === 0 ? "\n" : ""}`),
	},
	underline: { isLeaf: true, type: "underline" },
};
