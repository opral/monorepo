import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { parseMarkdown } from "@opral/markdown-wc";
import {
	markdownWcExtensions,
	astToTiptapDoc,
	tiptapDocToAst,
} from "@opral/markdown-wc/tiptap";
import { useEditorCtx } from "@/editor/editor-context";

type TipTapEditorProps = {
	initialMarkdown?: string;
	onAstChange?: (ast: any) => void;
	className?: string;
};

export function TipTapEditor({
	initialMarkdown = "# Hello, Flashtype\n\nStart typing…",
	onAstChange,
	className,
}: TipTapEditorProps) {
	const { setEditor } = useEditorCtx();
	const editor = useEditor({
		extensions: markdownWcExtensions(),
		content: astToTiptapDoc(parseMarkdown(initialMarkdown)) as any,
		onUpdate: ({ editor }) => {
			const ast = tiptapDocToAst(editor.getJSON() as any);
			onAstChange?.(ast);
		},
	});

	React.useEffect(() => {
		if (!editor) return;
		setEditor(editor as any);
		return () => setEditor(null);
	}, [editor, setEditor]);

	return (
		<div className={className} style={{ height: "100%" }}>
			<div className="w-full h-full bg-background p-3">
				<EditorContent
					editor={editor}
					className="w-full h-full max-w-5xl mx-auto"
				/>
			</div>
		</div>
	);
}
