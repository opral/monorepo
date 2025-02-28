import { NodeApi } from "@udecode/plate";
import { createPlatePlugin } from "@udecode/plate-core/react";
import { ClipboardEvent } from "react";

export const CreateCopyMarkdownPlugin = createPlatePlugin({
	key: "copy-to-markdown",
	handlers: {
		onCopy: (ctx) => {
			const event = ctx.event as ClipboardEvent;

			const editor = ctx.editor;
			if (!editor || !editor.selection) return;

			const selectedNodes = NodeApi.fragment(editor, editor.selection);

			// @ts-expect-error - markdown is not in the types
			const markdown = editor.api.markdown.serialize({
				nodes: selectedNodes,
			});

			window.navigator.clipboard.writeText(markdown);
			event.preventDefault();
		},
	},
});
