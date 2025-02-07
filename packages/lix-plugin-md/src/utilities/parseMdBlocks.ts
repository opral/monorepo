import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";

interface MdBlock {
	id: string;
	content: string;
	type: string;
}

function hashContent(content: string): string {
	let hash = 2166136261; // FNV-1a 32-bit offset basis
	for (let i = 0; i < content.length; i++) {
		hash ^= content.charCodeAt(i);
		hash +=
			(hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
	}
	return (hash >>> 0).toString(16).slice(0, 8); // Convert to hex and return first 8 chars
}

export function parseMdBlocks(data: ArrayBuffer | undefined): MdBlock[] {
	const markdown = new TextDecoder().decode(data);
	const tree = unified()
		.use(remarkParse as any)
		.parse(markdown);
	const blocks: MdBlock[] = [];

	visit(tree, (node) => {
		if (
			node.type === "paragraph" ||
			node.type === "code" ||
			node.type === "heading"
		) {
			const content = unified()
				.use(remarkStringify)
				.stringify(node as any)
				.trim();
			blocks.push({ id: hashContent(content), content, type: node.type });
		}
	});

	return blocks;
}
