import { serializeAst } from "@opral/markdown-wc";
import { tiptapDocToAst } from "@opral/markdown-wc/tiptap";

export function buildMarkdownFromEditor(editor: any): string {
	const ast = tiptapDocToAst(editor.getJSON() as any) as any;
	const root = {
		type: "root",
		children: (ast?.children ?? []) as any[],
	} as any;
	return serializeAst(root);
}
