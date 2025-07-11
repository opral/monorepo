import type { Node } from "mdast";

export function generateNodeId(node: Node, suffix?: string): string {
	// Create a deterministic ID based on node content and type
	let seed = node.type;

	// Include node value if present
	if ("value" in node && typeof node.value === "string") {
		seed += node.value;
	}

	// Include node position if present (for uniqueness)
	if (node.position) {
		seed += JSON.stringify(node.position);
	}

	// Add suffix for child nodes
	if (suffix) {
		seed += suffix;
	}

	// Create a simple hash from the seed to generate deterministic IDs
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		const char = seed.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Convert to base36 and take first 10 chars to match nanoid length
	const id = Math.abs(hash).toString(36).padStart(10, '0').substring(0, 10);
	return id;
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
