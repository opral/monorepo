import { createPlatePlugin } from "@udecode/plate-core/react";
import { ClipboardEvent } from "react";

export const CreateCopyMarkdownPlugin = createPlatePlugin({
	key: "copy-to-markdown",
	handlers: {
		onCopy: (ctx) => {
			const event = ctx.event as ClipboardEvent;

			const editor = ctx.editor;
			if (!editor || !editor.selection) return;

			// @ts-expect-error - markdown is not in the types
			const markdown = editor.api.markdown.serialize();

			window.navigator.clipboard.writeText(markdown);
			event.preventDefault();
		},
	},
});