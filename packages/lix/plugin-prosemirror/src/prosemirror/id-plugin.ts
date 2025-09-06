import { Plugin } from "prosemirror-state";

// A plugin that adds unique IDs to each node for change detection
export const idPlugin = () =>
	new Plugin({
		appendTransaction: (_transactions, _oldState, newState) => {
			// Start with the current state's transaction, in case other plugins modified it
			let tr = newState.tr;
			let idsAdded = false;

			// Iterate through all nodes in the *new* state's document
			newState.doc.descendants((node, pos) => {
				// Check if the node instance already has an ID attribute
				const nodeInstanceHasId = !!(node.attrs && node.attrs.id);

				// Add an ID if the node is not a text node AND it doesn't have an ID yet
				if (!node.isText && !nodeInstanceHasId) {
					const nodeId = crypto.randomUUID();
					// Ensure attrs object exists, then add/overwrite the id
					const newAttrs = { ...(node.attrs || {}), id: nodeId };
					// Important: Apply the change to the transaction `tr` we are building
					tr = tr.setNodeMarkup(pos, null, newAttrs);
					idsAdded = true;
				}
			});

			// Return the transaction only if we added IDs
			// Check if the transaction has actual steps, otherwise returning it might cause issues
			return idsAdded && tr.steps.length > 0 ? tr : null;
		},
	});
