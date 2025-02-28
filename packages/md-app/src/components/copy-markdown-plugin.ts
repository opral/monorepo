import { createPlatePlugin } from "@udecode/plate-core/react";
import { ClipboardEvent, KeyboardEvent } from "react";

export const CreateCopyMarkdownPlugin = createPlatePlugin({
	key: "copy-to-markdown",
	handlers: {
		onCopy: (ctx) => {
			console.log("onCopy");
			const event = ctx.event as ClipboardEvent;

			const editor = ctx.editor;
			if (!editor || !editor.selection) return;

			// @ts-expect-error - markdown is not in the types
			const markdown = editor.api.markdown.serialize();
			console.log({ markdown });

			window.navigator.clipboard.writeText(markdown);
			event.preventDefault();
		},
		onPaste: (ctx) => {
			console.log("onPaste");
			// debugger;
		},
	},
});