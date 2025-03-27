import { Node } from "prosemirror-model";
import { EditorView, NodeView } from "prosemirror-view";
import { schema } from "./schema";

// Generate a random ID for new inputs
function generateRandomId(length = 8) {
	return Math.random()
		.toString(36)
		.substring(2, 2 + length);
}

// Custom node view for the description section
export class DescriptionNodeView implements NodeView {
	dom: HTMLElement;
	contentDOM: HTMLElement;

	constructor(_node: Node) {
		// Create the main container
		this.dom = document.createElement("div");
		this.dom.className = "my-4";

		// Create the header
		const header = document.createElement("h2");
		header.className = "text-sm font-medium mb-2";
		header.textContent = "DESCRIPTION";
		this.dom.appendChild(header);

		// Create the content container
		this.contentDOM = document.createElement("div");
		this.contentDOM.className = "description";
		this.dom.appendChild(this.contentDOM);
	}
}

// Custom node view for the inputs section
export class InputsNodeView implements NodeView {
	dom: HTMLElement;
	contentDOM: HTMLElement;
	view: EditorView;
	getPos: () => number | undefined;

	constructor(_node: Node, view: EditorView, getPos: () => number | undefined) {
		this.view = view;
		this.getPos = getPos;

		// Create the main container
		this.dom = document.createElement("div");
		this.dom.className = "my-4";

		// Create the header
		const header = document.createElement("h2");
		header.className = "text-sm font-medium mb-2";
		header.textContent = "INPUTS";
		this.dom.appendChild(header);

		// Create a wrapper div for the content and button to keep them in a single row
		const rowWrapper = document.createElement("div");
		rowWrapper.className = "flex flex-row items-center space-x-2";
		this.dom.appendChild(rowWrapper);

		// Create the content container
		this.contentDOM = document.createElement("div");
		this.contentDOM.className = "flex flex-row items-center";
		rowWrapper.appendChild(this.contentDOM);

		// Add "New Input" button in the same row
		const newInputBtn = document.createElement("button");
		newInputBtn.className = "btn btn-sm btn-outline p-0";
		newInputBtn.textContent = "+ New Input";
		newInputBtn.addEventListener("click", (e) => {
			e.preventDefault();
			this.addNewInput();
		});
		rowWrapper.appendChild(newInputBtn);
	}

	// Method to add a new input
	addNewInput() {
		const pos = this.getPos();
		if (pos === undefined) return;

		// Generate a random name and ID for the new input
		const randomName = `input_${generateRandomId(4)}`;
		const randomId = `input_${generateRandomId(16)}`;

		// Create a new input node
		const inputNode = schema.nodes.input.create({
			dragHandlesDisabled: true,
			label: randomName,
			id: randomId,
			description: "",
			type: "longtext",
			strictType: {
				typeId: "wtString",
				constraints: [],
				metadata: {
					attributes: [],
				},
			},
			variableType: null,
			fromTrigger: false,
		});

		// Find the position to insert the new input
		const nodeAtPos = this.view.state.doc.nodeAt(pos);
		if (!nodeAtPos) return;

		const tr = this.view.state.tr;
		let insertPos = pos + 1; // Default position for empty inputs node

		// If there are existing children, calculate position after the last child
		if (nodeAtPos.childCount > 0) {
			insertPos = pos + nodeAtPos.content.size + 1;
		}

		// Insert the new input node
		tr.insert(insertPos, inputNode);
		this.view.dispatch(tr);
	}
}

// Custom node view for horizontal rule
export class HorizontalRuleNodeView implements NodeView {
	dom: HTMLElement;

	constructor() {
		this.dom = document.createElement("hr");
		this.dom.className = "border-base-300 my-4";
	}
}

// Custom node view for individual input items
export class InputNodeView implements NodeView {
	dom: HTMLElement;
	node: Node;
	view: EditorView | null;
	getPos: (() => number | undefined) | null;

	constructor(
		node: Node,
		view?: EditorView,
		getPos?: () => number | undefined,
	) {
		this.node = node;
		this.view = view || null;
		this.getPos = getPos || null;

		// Create the main container
		this.dom = document.createElement("div");
		this.dom.className = "badge gap-1 p-3 border border-base-300 rounded";

		// Create the input label prefix
		const labelPrefix = document.createElement("span");
		labelPrefix.className = "text-xs";
		labelPrefix.textContent = "inp";
		this.dom.appendChild(labelPrefix);

		// Create the input label text
		const labelText = document.createElement("span");
		labelText.textContent = node.attrs.label || "";
		this.dom.appendChild(labelText);

		// Add delete button
		if (this.view && this.getPos) {
			const deleteBtn = document.createElement("span");
			deleteBtn.className = "ml-1 cursor-pointer";
			deleteBtn.textContent = "x";
			deleteBtn.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.deleteInput();
			});
			this.dom.appendChild(deleteBtn);
		}
	}

	// Method to delete this input
	deleteInput() {
		if (!this.view || !this.getPos) return;

		const pos = this.getPos();
		if (typeof pos !== "number") return;

		// Create a transaction to delete this node
		const tr = this.view.state.tr;
		tr.delete(pos, pos + this.node.nodeSize);
		this.view.dispatch(tr);
	}
}

// Custom node view for mention nodes
export class MentionNodeView implements NodeView {
	dom: HTMLElement;

	constructor(node: Node) {
		this.dom = document.createElement("span");
		this.dom.className = "border border-base-300 px-1 rounded";
		this.dom.textContent = `@${node.attrs.lastLabel || ""}`;
	}
}

// Custom node view for generation nodes
export class GenerationNodeView implements NodeView {
	dom: HTMLElement;

	constructor(node: Node) {
		this.dom = document.createElement("div");
		this.dom.className = "flex items-center gap-2 my-2";

		const badge = document.createElement("div");
		badge.className = "badge badge-sm gap-1";

		const icon = document.createElement("span");
		icon.className = "text-xs";
		icon.textContent = "✨";
		badge.appendChild(icon);

		const label = document.createElement("span");
		label.textContent = "generation";
		badge.appendChild(label);

		this.dom.appendChild(badge);

		const model = document.createElement("span");
		model.className = "text-xs";
		model.textContent = node.attrs.model || "";
		this.dom.appendChild(model);
	}
}

// Function to register all custom node views
export function registerCustomNodeViews(_editorView: EditorView) {
	return {
		description: (node: Node) => new DescriptionNodeView(node),
		inputs: (node: Node, view: EditorView, getPos: () => number | undefined) =>
			new InputsNodeView(node, view, getPos),
		horizontalRule: () => new HorizontalRuleNodeView(),
		input: (node: Node, view: EditorView, getPos: () => number | undefined) =>
			new InputNodeView(node, view, getPos),
		mention: (node: Node) => new MentionNodeView(node),
		generation: (node: Node) => new GenerationNodeView(node),
	};
}
