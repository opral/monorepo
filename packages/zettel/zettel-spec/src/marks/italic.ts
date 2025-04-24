/**
 * Vendored from https://github.com/ueberdosis/tiptap/blob/main/packages/extension-italic/src/italic.ts
 */

import { Mark, markInputRule, markPasteRule, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		italic: {
			/**
			 * Set an italic mark
			 * @example editor.commands.setItalic()
			 */
			setItalic: () => ReturnType;
			/**
			 * Toggle an italic mark
			 * @example editor.commands.toggleItalic()
			 */
			toggleItalic: () => ReturnType;
			/**
			 * Unset an italic mark
			 * @example editor.commands.unsetItalic()
			 */
			unsetItalic: () => ReturnType;
		};
	}
}

/**
 * Matches an italic to a _italic_ on input.
 */
export const underscoreInputRegex = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))$/;

/**
 * This extension allows you to create italic text.
 * @see https://www.tiptap.dev/api/marks/italic
 */
export const ItalicMark = Mark.create({
	name: "zettel_italic",

	parseHTML() {
		return [{ tag: "em" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["em", mergeAttributes(HTMLAttributes), 0];
	},

	addCommands() {
		return {
			setItalic:
				() =>
				({ commands }) => {
					return commands.setMark(this.name);
				},
			toggleItalic:
				() =>
				({ commands }) => {
					return commands.toggleMark(this.name);
				},
			unsetItalic:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			"Mod-i": () => this.editor.commands.toggleItalic(),
			"Mod-I": () => this.editor.commands.toggleItalic(),
		};
	},

	addInputRules() {
		return [
			markInputRule({
				find: underscoreInputRegex,
				type: this.type,
			}),
		];
	},

	addPasteRules() {
		return [
			markPasteRule({
				find: underscoreInputRegex,
				type: this.type,
			}),
		];
	},
});
