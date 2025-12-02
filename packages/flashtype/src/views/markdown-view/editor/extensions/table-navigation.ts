import { Extension } from "@tiptap/core";

/**
 * Extension to handle table navigation.
 * Adds Mod+Enter to exit a table and create a paragraph below it.
 */
export const TableNavigationExtension = Extension.create({
	name: "tableNavigation",

	addKeyboardShortcuts() {
		return {
			// Mod+Enter exits the table and creates a paragraph below
			"Mod-Enter": ({ editor }) => {
				const { state } = editor;
				const { selection } = state;
				const { $from } = selection;

				// Check if we're inside a table
				let tableNode = null;
				let tablePos = -1;

				for (let depth = $from.depth; depth > 0; depth--) {
					const node = $from.node(depth);
					if (node.type.name === "table") {
						tableNode = node;
						tablePos = $from.before(depth);
						break;
					}
				}

				if (!tableNode || tablePos === -1) {
					return false;
				}

				// Calculate position after the table
				const posAfterTable = tablePos + tableNode.nodeSize;

				// Insert a paragraph after the table and move cursor there
				editor
					.chain()
					.focus()
					.insertContentAt(posAfterTable, { type: "paragraph" })
					.setTextSelection(posAfterTable + 1)
					.run();

				return true;
			},
		};
	},
});
