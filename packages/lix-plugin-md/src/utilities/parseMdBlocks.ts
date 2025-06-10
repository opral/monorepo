import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";

export type MdBlock = {
	id: string;
	content: string;
	type: string;
};

// NOTE - this file is closely related to the id-enriched-serializer.ts file in the md-app
// XXX - if you change the parsing here make sure you also update the serializer
export function parseMdBlocks(data: Uint8Array) {
	const markdown = new TextDecoder().decode(data);
	// Create a Unicode-safe hash for the ID prefix
	const idPrefix = createSafeHash(markdown);
	const tree = unified()
		.use(remarkParse as any)
		.parse(markdown);

	const blocks: { id: string; content: string; type: string }[] = [];
	let nextId: string | undefined = undefined;

	let nodePosition = 0;
	visit(tree, (node) => {
		// handle empty paragraphs:
		if (
			node.type === "html" &&
			(node as any).value.startsWith("<!-- id: ") &&
			(node as any).value.endsWith("--><br>")
		) {
			const match = (node as any).value.match(/id:\s*([\w-]+)/);
			if (match) {
				nextId = match[1];
				blocks.push({ id: nextId!, content: "<br>", type: "paragraph" });
				nextId = undefined;
			}
			return;
		}

		if (node.type === "html" && (node as any).value.startsWith("<!-- id: ")) {
			const match = (node as any).value.match(/id:\s*([\w-]+)/);
			if (match) nextId = match[1];
			return; // Skip adding this node to blocks
		}

		if (["paragraph", "heading", "code"].includes(node.type)) {
			const content = unified()
				.use(remarkStringify)
				.stringify(node as any)
				.trim();
			const id = nextId || `${idPrefix}_${nodePosition}`;
			blocks.push({ id, content, type: node.type });
			nextId = undefined; // Reset after use
		}
		nodePosition += 1;
	});

	return blocks;
}

function createSafeHash(input: string): string {
	// Create a simple hash from the input string that's safe for all Unicode characters
	let hash = 0;
	if (input.length === 0) return hash.toString();

	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Convert to base36 for a readable string and take first 8 characters
	return Math.abs(hash).toString(36).substring(0, 8);
}
