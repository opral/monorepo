import { NodeApi } from "@udecode/plate";
import { createPlatePlugin } from "@udecode/plate-core/react";
import { serializeMdNodes } from "@udecode/plate-markdown";
import { ClipboardEvent } from "react";

export const CreateCopyMarkdownPlugin = createPlatePlugin({
	key: "copy-to-markdown",
	handlers: {
		onCopy: (ctx) => {
			const event = ctx.event as ClipboardEvent;

			const editor = ctx.editor;
			if (!editor || !editor.selection) return;

			const selectedNodes = NodeApi.fragment(editor, editor.selection);
			const serializedMdNodes = serializeMdNodes(selectedNodes);

			window.navigator.clipboard.writeText(serializedMdNodes);
			event.preventDefault();
		},
	},
});
