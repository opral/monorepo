import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import type { Root, Node } from "mdast";
import {
	generateNodeId,
	parseHtmlIdComment,
	isHtmlIdComment,
} from "./idUtils.js";

export interface MdAstNode extends Node {
	mdast_id: string;
	children?: MdAstNode[];
	[key: string]: any;
}

export interface MdAst {
	type: "root";
	children: MdAstNode[];
	position?: Root["position"];
}

export function parseMarkdown(markdown: string): MdAst {
	const processor = unified()
		.use(remarkParse as any)
		.use(remarkGfm as any)
		.use(remarkFrontmatter as any, ["yaml"]);
	
	const ast = processor.parse(markdown) as Root;
	return enrichWithIds(ast);
}

function enrichWithIds(ast: Root): MdAst {
	let previousNode: Node | null = null;
	const processedNodes: MdAstNode[] = [];

	for (const node of ast.children) {
		// Skip HTML ID comments, extract ID for next node
		if (isHtmlIdComment(node)) {
			previousNode = node;
			continue;
		}

		// Assign ID to current node
		const nodeId =
			previousNode && isHtmlIdComment(previousNode)
				? parseHtmlIdComment((previousNode as any).value)
				: generateNodeId(node);

		// Process children recursively if they exist
		const processedNode: MdAstNode = {
			...node,
			mdast_id: nodeId,
			children: (node as any).children
				? processChildren((node as any).children as Node[])
				: undefined,
		} as MdAstNode;

		processedNodes.push(processedNode);
		previousNode = null;
	}

	return {
		type: "root",
		children: processedNodes,
		position: ast.position,
	};
}

function processChildren(children: Node[]): MdAstNode[] {
	return children.map((child, index) => {
		const childId = generateNodeId(child, index.toString());
		return {
			...child,
			mdast_id: childId,
			children: (child as any).children
				? processChildren((child as any).children as Node[])
				: undefined,
		} as MdAstNode;
	});
}
