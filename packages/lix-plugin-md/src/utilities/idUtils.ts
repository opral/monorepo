import type { Node } from "mdast";
import { createHash } from "crypto";

export function generateNodeId(node: Node, suffix?: string): string {
	// Create a hash based on node content and type
	const hash = createHash("md5");

	// Include node type
	hash.update(node.type);

	// Include node value if present
	if ("value" in node && typeof node.value === "string") {
		hash.update(node.value);
	}

	// Include node position if present (for uniqueness)
	if (node.position) {
		hash.update(JSON.stringify(node.position));
	}

	// Add suffix for child nodes
	if (suffix) {
		hash.update(suffix);
	}

	// Generate a short, readable ID
	const fullHash = hash.digest("hex");
	return fullHash.substring(0, 8);
}

export function parseHtmlIdComment(html: string): string {
	const match = html.match(/mdast_id\s*=\s*([^\s>]+)/);
	return match?.[1]?.trim() ?? "";
}

export function isHtmlIdComment(node: Node): boolean {
	return (
		node.type === "html" &&
		"value" in node &&
		typeof node.value === "string" &&
		node.value.includes("mdast_id =")
	);
}
