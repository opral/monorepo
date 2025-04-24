import { Node } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { nanoid } from "../utils/nano-id.js";

export const ZettelDoc = Node.create({
	name: "zettel_doc",
	content: "block+",
	topNode: true,

	parseHTML() {
		return [{ tag: "div" }];
	},

	renderHTML() {
		return ["div", { "data-zettel-doc": "true" }, 0];
	},

	addProseMirrorPlugins() {
		return [zettelKeyPlugin];
	},
});

const zettelKeyPlugin = new Plugin({
	appendTransaction: (transactions, _, newState) => {
		let tr = newState.tr;
		if (!transactions.some((t) => t.docChanged)) return tr;

		const ids = new Set();
		newState.doc.descendants((node, pos) => {
			if (node.isText === false) {
				const nodeId = node.attrs["zettel_key"];

				// If the node doesn't have an id or it's a duplicate
				if (!nodeId || ids.has(nodeId)) {
					const newId = nanoid();
					tr = tr.setNodeMarkup(pos, undefined, {
						...node.attrs,
						zettel_key: newId,
					});
					ids.add(newId);
				} else {
					ids.add(nodeId);
				}
			}
		});

		return tr;
	},
});
