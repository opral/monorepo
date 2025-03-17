import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";
import { Plugin } from "prosemirror-state";

// A minimal setup to make ProseMirror work
export function exampleSetup() {
	const plugins = [history(), keymap(baseKeymap)];

	// Add unique IDs to nodes
	const idPlugin = new Plugin({
		appendTransaction: (transactions, _, newState) => {
			if (!transactions.some((transaction) => transaction.docChanged))
				return null;

			// Check if there are nodes that need IDs
			let modified = false;
			let tr = newState.tr;

			newState.doc.descendants((node, pos) => {
				if (!node.isText && !node.attrs._id) {
					// Set a new _id attribute
					const nodeId = `${node.type.name}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
					tr = tr.setNodeAttribute(pos, "_id", nodeId);
					modified = true;
				}
			});

			return modified ? tr : null;
		},
	});

	plugins.push(idPlugin);

	return plugins;
}