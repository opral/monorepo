import { Plugin } from "prosemirror-state";

// A plugin that adds unique IDs to each node for change detection
export const idPlugin = new Plugin({
	appendTransaction: (transactions, _, newState) => {
		if (!transactions.some((transaction) => transaction.docChanged))
			return null;

		// Check if there are nodes that need IDs
		let modified = false;
		let tr = newState.tr;

		// Skip the doc node but process all others
		newState.doc.descendants((node, pos) => {
			// Only add IDs to non-text nodes and only if they don't already have an _id
			if (!node.isText && (!node.attrs || !node.attrs._id)) {
				const nodeId = crypto.randomUUID();

				// Create new attrs object if it doesn't exist
				const attrs = node.attrs || {};

				// Set the _id attribute
				tr = tr.setNodeMarkup(pos, null, { ...attrs, _id: nodeId });
				modified = true;
			}
		});

		return modified ? tr : null;
	},
});
