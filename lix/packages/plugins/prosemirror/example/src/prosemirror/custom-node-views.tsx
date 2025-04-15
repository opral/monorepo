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

		// Create the content container (no header)
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
		// Add the entity ID attribute
		if (node.attrs.id) {
			this.dom.setAttribute("data-diff-id", node.attrs.id);
		}

		// Create the input label prefix with a grayscale image icon using SVG
		const labelPrefix = document.createElement("span");
		labelPrefix.className = "text-xs";
		labelPrefix.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
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
		this.dom.className = "mention";
		// Add the entity ID attribute
		if (node.attrs.id) {
			this.dom.setAttribute("data-diff-id", node.attrs.id);
		}

		// Create a container for the mention text and icon
		const container = document.createElement("span");
		container.className = "mention-content";

		// Add the mention text
		const mentionText = document.createElement("span");
		mentionText.textContent = `@${node.attrs.lastLabel || ""}`;
		container.appendChild(mentionText);

		// Add audio wave icon if lastType is audio
		if (node.attrs.lastType === "audio") {
			const audioIcon = document.createElement("span");
			audioIcon.className = "audio-icon ml-1";
			audioIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 10v4"></path>
				<path d="M8 8v8"></path>
				<path d="M12 4v16"></path>
				<path d="M16 8v8"></path>
				<path d="M20 10v4"></path>
			</svg>`;
			container.appendChild(audioIcon);
		}

		this.dom.appendChild(container);
	}
}

// Custom node view for generation nodes
export class GenerationNodeView implements NodeView {
	dom: HTMLElement;

	constructor(node: Node) {
		// Create an inline span instead of a div
		this.dom = document.createElement("span");
		this.dom.className = "inline-flex items-center gap-1";
		// Add the entity ID attribute
		if (node.attrs.id) {
			this.dom.setAttribute("data-diff-id", node.attrs.id);
		}

		const icon = document.createElement("span");
		icon.className = "text-xs";
		icon.textContent = "✨";
		this.dom.appendChild(icon);

		const label = document.createElement("span");
		label.textContent = "generation";
		this.dom.appendChild(label);

		const model = document.createElement("span");
		model.className = "text-xs ml-1";
		model.textContent = node.attrs.model || "";
		this.dom.appendChild(model);
	}
}

// Custom node view for tool nodes
export class ToolNodeView implements NodeView {
	dom: HTMLElement;

	constructor(node: Node) {
		// Create the main container
		this.dom = document.createElement("div");
		this.dom.className = "tool-container border rounded-md p-2 my-2 bg-gray-50";
		// Add the entity ID attribute
		if (node.attrs.id) {
			this.dom.setAttribute("data-diff-id", node.attrs.id);
		}

		// Create the header with tool label and icon
		const header = document.createElement("div");
		header.className = "flex items-center justify-between mb-2";

		// Left side with icon and label
		const labelContainer = document.createElement("div");
		labelContainer.className = "flex items-center gap-2";

		// Tool icon - use speaker icon for ElevenLabs tools
		const icon = document.createElement("span");
		icon.className = "text-indigo-500";

		if (node.attrs.toolId === "elevenLabs") {
			// Speaker icon for ElevenLabs
			icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
		} else {
			// Default info icon for other tools
			icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12h.01"></path><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path></svg>`;
		}

		labelContainer.appendChild(icon);

		// Tool label
		const label = document.createElement("span");
		label.className = "font-medium";
		label.textContent = node.attrs.label || "Tool";
		labelContainer.appendChild(label);

		header.appendChild(labelContainer);

		// Settings icon on the right
		const settingsIcon = document.createElement("span");
		settingsIcon.className = "text-gray-400";
		settingsIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
		header.appendChild(settingsIcon);

		this.dom.appendChild(header);

		// Create the content section
		const content = document.createElement("div");
		content.className = "tool-content";

		try {
			// Parse parameters
			const parameters = JSON.parse(node.attrs.parameters || "{}");

			// Create parameters display
			if (parameters) {
				// Create a container for the parameters
				const paramsContainer = document.createElement("div");
				paramsContainer.className =
					"flex justify-between border-t border-gray-200 py-2";

				// Create left column for "text" parameter
				const leftColumn = document.createElement("div");
				leftColumn.className = "flex items-center gap-2"; // Changed to flex-row with gap

				// Create right column for "voice" parameter
				const rightColumn = document.createElement("div");
				rightColumn.className = "flex items-center gap-2"; // Changed to flex-row with gap

				// Add column headers
				const leftHeader = document.createElement("span");
				leftHeader.className = "text-gray-500 text-sm font-medium";
				leftHeader.textContent = "Text:";
				leftColumn.appendChild(leftHeader);

				const rightHeader = document.createElement("span");
				rightHeader.className = "text-gray-500 text-sm font-medium";
				rightHeader.textContent = "Voice:";
				rightColumn.appendChild(rightHeader);

				// Add parameter values
				Object.entries(parameters).forEach(([key, value]: [string, any]) => {
					if (key.toLowerCase() === "text") {
						// Add text value to left column
						const textValue = document.createElement("span");
						textValue.className = "text-sm"; // Removed mt-1

						// Handle different value types
						if (
							value &&
							typeof value === "object" &&
							value.type &&
							value.value
						) {
							if (value.type === "variable") {
								// Check if it's a generation variable (starts with "gen_")
								if (
									typeof value.value === "string" &&
									value.value.startsWith("gen_")
								) {
									textValue.textContent = "@generation";
								} else {
									textValue.textContent = `@${value.value}`;
								}
								textValue.className += " text-gray-400";
							} else {
								textValue.textContent = value.value;
							}
						} else {
							textValue.textContent = String(value);
						}

						leftColumn.appendChild(textValue);
					} else if (key.toLowerCase() === "voice") {
						// Add voice value to right column
						const voiceValue = document.createElement("span");
						voiceValue.className = "text-sm"; // Removed mt-1

						// Handle different value types
						if (
							value &&
							typeof value === "object" &&
							value.type &&
							value.value
						) {
							if (value.type === "variable") {
								// Check if it's a generation variable (starts with "gen_")
								if (
									typeof value.value === "string" &&
									value.value.startsWith("gen_")
								) {
									voiceValue.textContent = "@generation";
								} else {
									voiceValue.textContent = `@${value.value}`;
								}
								voiceValue.className += " text-gray-400";
							} else {
								voiceValue.textContent = value.value;
							}
						} else {
							voiceValue.textContent = String(value);
						}

						rightColumn.appendChild(voiceValue);
					}
				});

				// Add columns to container
				paramsContainer.appendChild(leftColumn);
				paramsContainer.appendChild(rightColumn);
				content.appendChild(paramsContainer);

				// Add any other parameters that aren't text or voice
				Object.entries(parameters).forEach(([key, value]: [string, any]) => {
					if (key.toLowerCase() !== "text" && key.toLowerCase() !== "voice") {
						const paramRow = document.createElement("div");
						paramRow.className =
							"flex items-center justify-between py-1 border-t border-gray-200";

						// Parameter key
						const keyElem = document.createElement("span");
						keyElem.className = "text-gray-500 text-sm";
						keyElem.textContent = `${key}:`;
						paramRow.appendChild(keyElem);

						// Parameter value
						const valueElem = document.createElement("span");
						valueElem.className = "text-sm";

						// Handle different value types
						if (
							value &&
							typeof value === "object" &&
							value.type &&
							value.value
						) {
							if (value.type === "variable") {
								// Check if it's a generation variable (starts with "gen_")
								if (
									typeof value.value === "string" &&
									value.value.startsWith("gen_")
								) {
									valueElem.textContent = "@generation";
								} else {
									valueElem.textContent = `@${value.value}`;
								}
								valueElem.className += " text-gray-400";
							} else {
								valueElem.textContent = value.value;
							}
						} else {
							valueElem.textContent = String(value);
						}

						paramRow.appendChild(valueElem);
						content.appendChild(paramRow);
					}
				});
			}
		} catch (e) {
			console.error("Error parsing tool parameters:", e);

			// Fallback display
			const errorText = document.createElement("div");
			errorText.className = "text-red-500 text-sm";
			errorText.textContent = "Error parsing tool parameters";
			content.appendChild(errorText);
		}

		this.dom.appendChild(content);
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
		tool: (node: Node) => new ToolNodeView(node),
	};
}
