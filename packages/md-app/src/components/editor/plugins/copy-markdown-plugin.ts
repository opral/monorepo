import { NodeApi } from "@udecode/plate";
import { createPlatePlugin } from "@udecode/plate-core/react";
import { serializeMdNodes } from "@udecode/plate-markdown";
import { ClipboardEvent } from "react";
import { ExtendedMarkdownPlugin } from "./markdown/markdown-plugin";

export const CreateCopyMarkdownPlugin = createPlatePlugin({
	key: "copy-to-markdown",
	handlers: {
		onCopy: (ctx) => {
			const event = ctx.event as ClipboardEvent;

			const editor = ctx.editor;
			if (!editor || !editor.selection) return;
debugger;

			const selectedNodes = NodeApi.fragment(editor, editor.selection);
			
			const markdown = editor.getApi(ExtendedMarkdownPlugin).markdown.serialize(selectedNodes)

			window.navigator.clipboard.writeText(markdown);
			event.preventDefault();
		},
	},
});
