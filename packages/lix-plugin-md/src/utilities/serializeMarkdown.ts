import { unified } from "unified";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import type { MdAst } from "./parseMarkdown.js";

export interface SerializeOptions {
	skip_id_comments?: boolean;
}

export function serializeMarkdown(
	ast: MdAst,
	options: SerializeOptions = {},
): string {
	const children: any[] = [];

	for (const node of ast.children) {
		// Add ID comment unless skipped
		if (!options.skip_id_comments && node.mdast_id) {
			children.push({
				type: "html",
				value: `<!-- mdast_id = ${node.mdast_id} -->`,
			});
		}

		// Add the actual node (without mdast_id property)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { mdast_id, ...nodeWithoutId } = node;
		children.push(stripMdastIds(nodeWithoutId));
	}

	const processedAst = {
		...ast,
		children,
	};

	return (
		unified()
			.use(remarkStringify, {
				bullet: "-",
				fences: true,
				incrementListMarker: false,
			})
			.use(remarkGfm as any)
			.use(remarkFrontmatter as any, ["yaml"])
			.stringify(processedAst)
	);
}

function stripMdastIds(node: any): any {
	if (!node || typeof node !== "object") {
		return node;
	}

	if (Array.isArray(node)) {
		return node.map(stripMdastIds);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { mdast_id, ...nodeWithoutId } = node;

	// Recursively strip mdast_id from children
	if (nodeWithoutId.children) {
		nodeWithoutId.children = nodeWithoutId.children.map(stripMdastIds);
	}

	return nodeWithoutId;
}
