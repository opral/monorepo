import { Node, Schema, DOMOutputSpec } from "prosemirror-model";

// Helper function to add data-diff-key attribute
function addDiffKey(node: Node, spec: DOMOutputSpec): DOMOutputSpec {
	if (node.attrs.id && Array.isArray(spec) && spec.length > 0) {
		const tag = spec[0];
		let attrs: { [key: string]: any } = {};
		let content = spec.slice(2); // Default content starts from index 2

		if (spec.length > 1) {
			const maybeAttrs = spec[1];
			if (
				typeof maybeAttrs === "object" &&
				maybeAttrs !== null &&
				!Array.isArray(maybeAttrs)
			) {
				// It's an attribute object
				attrs = { ...maybeAttrs };
			} else {
				// It's not an attribute object, must be the content hole (or part of content)
				attrs = {}; // Start with empty attributes
				content = spec.slice(1); // Correct content starts from index 1
			}
		}

		attrs["data-diff-key"] = node.attrs.id;
		attrs["data-diff-mode"] = "words";

		// Reconstruct the spec: tag, attributes object, then the rest of the content
		return [tag, attrs, ...content];
	}
	// Return original spec if no id or spec is not an array we can modify
	return spec;
}

// Define schema that matches both before.json and after.json structures
export const schema = new Schema({
	nodes: {
		// The top level document node
		doc: {
			content:
				"(paragraph | title | description | inputs | horizontalRule | bulletList | tool)+",
		},

		// Nodes from before.json and after.json
		title: {
			content: "text*",
			group: "block",
			attrs: {
				dragHandlesDisabled: { default: true },
				level: { default: 1 },
				id: { default: null },
			},
			toDOM(node) {
				return addDiffKey(node, ["h1", 0]);
			},
		},
		description: {
			content: "paragraph*",
			group: "block",
			attrs: {
				dragHandlesDisabled: { default: true },
				id: { default: null },
			},
			toDOM(node) {
				return addDiffKey(node, ["div", { class: "description" }, 0]);
			},
		},
		inputs: {
			content: "input*",
			group: "block",
			attrs: {
				dragHandlesDisabled: { default: true },
				id: { default: "INPUTS" },
				mode: { default: "inputs" },
			},
			toDOM(node) {
				return addDiffKey(node, ["div", { class: "inputs" }, 0]);
			},
		},
		input: {
			group: "block",
			attrs: {
				dragHandlesDisabled: { default: true },
				label: { default: "" },
				id: { default: "" },
				description: { default: "" },
				type: { default: "longtext" },
				strictType: { default: null },
				variableType: { default: null },
				fromTrigger: { default: false },
			},
			toDOM(node) {
				return addDiffKey(node, ["div", { class: "input" }, 0]);
			},
		},
		horizontalRule: {
			group: "block",
			attrs: {
				id: { default: null },
			},
			toDOM(node) {
				return addDiffKey(node, ["hr"]);
			},
		},
		paragraph: {
			content: "(text | inline)*",
			group: "block",
			attrs: {
				id: { default: null },
			},
			toDOM(node) {
				return addDiffKey(node, ["p", 0]);
			},
		},
		bulletList: {
			content: "listItem+",
			group: "block",
			attrs: {
				id: { default: null },
			},
			toDOM(node) {
				return addDiffKey(node, ["ul", 0]);
			},
		},
		listItem: {
			content: "paragraph+",
			attrs: {
				id: { default: null },
			},
			toDOM(node) {
				return addDiffKey(node, ["li", 0]);
			},
		},
		mention: {
			group: "inline",
			inline: true,
			attrs: {
				referenceId: { default: "" },
				path: { default: "" },
				lastType: { default: "" },
				lastStrictType: { default: null },
				lastLabel: { default: "" },
				id: { default: null },
			},
			toDOM(node) {
				return addDiffKey(node, ["span", { class: "mention" }, 0]);
			},
		},
		generation: {
			group: "inline",
			inline: true,
			attrs: {
				id: { default: "" },
				label: { default: "generation" },
				state: { default: "editing" },
				temperature: { default: 0.5 },
				effort: { default: "medium" },
				includeReasoning: { default: false },
				model: { default: "gpt-4o" },
				type: { default: "full" },
				stopBefore: { default: '["","","",""]' },
				responseModel: { default: "{}" },
			},
			toDOM(node) {
				return addDiffKey(node, ["span", { class: "generation" }, 0]);
			},
		},
		tool: {
			group: "block",
			attrs: {
				id: { default: "" },
				toolId: { default: "elevenLabs" },
				includeOutput: { default: "false" },
				parameters: { default: "{}" },
				label: { default: "" },
				outputs: { default: "[]" },
				state: { default: null },
			},
			toDOM(node) {
				return addDiffKey(node, ["div", { class: "tool" }, 0]);
			},
		},
		text: {
			group: "inline",
		},
	},

	marks: {
		strong: {
			toDOM() {
				return ["strong", 0];
			},
		},
		em: {
			toDOM() {
				return ["em", 0];
			},
		},
		italic: {
			toDOM() {
				return ["em", 0];
			},
		},
	},
});