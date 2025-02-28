import { createPlatePlugin } from "@udecode/plate-core/react";
import { ClipboardEvent } from "react";

export const CreateCopyMarkdownPlugin = createPlatePlugin({
	key: "copy-to-markdown",
	handlers: {
		onCopy: (ctx) => {
			console.log("onCopy");
			const event = ctx.event as ClipboardEvent;
			console.log(event);

			const editor = ctx.editor;
			if (!editor || !editor.selection) return;

			// @ts-expect-error - markdown is not in the types
			const markdown = editor.api.markdown.serialize();
			console.log({ markdown });

			if (markdown) {
				event.preventDefault();
				event.clipboardData?.setData("text/plain", markdown);
				event.clipboardData?.setData("text/markdown", markdown);
			}
		},
	},
});
