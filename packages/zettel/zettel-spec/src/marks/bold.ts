/**
 * Vendored from https://github.com/ueberdosis/tiptap/blob/main/packages/extension-bold/src/bold.ts
 */

import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		bold: {
			/**
			 * Set a bold mark
			 */
			setBold: () => ReturnType;
			/**
			 * Toggle a bold mark
			 */
			toggleBold: () => ReturnType;
			/**
			 * Unset a bold mark
			 */
			unsetBold: () => ReturnType;
		};
	}
}

/**
 * Matches bold text via `**` as input.
 */
export const starInputRegex = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/;

/**
 * This extension allows you to mark text as bold.
 * @see https://tiptap.dev/api/marks/bold
 */
export const BoldMark = Mark.create({
	name: "zettel_bold",

	parseHTML() {
		return [
			{
				tag: "strong",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["strong", mergeAttributes(HTMLAttributes), 0];
	},

	addCommands() {
		return {
			setBold:
				() =>
				({ commands }) =>
					commands.setMark(this.name),
			toggleBold:
				() =>
				({ commands }) =>
					commands.toggleMark(this.name),
			unsetBold:
				() =>
				({ commands }) =>
					commands.unsetMark(this.name),
		};
	},

	addKeyboardShortcuts() {
		return {
			"Mod-b": () => this.editor.commands.toggleBold(),
		};
	},
});
