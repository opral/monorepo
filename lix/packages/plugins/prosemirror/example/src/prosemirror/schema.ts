import { Schema } from "prosemirror-model";

// Define schema that matches both before.json and after.json structures
export const schema = new Schema({
  nodes: {
    // The top level document node
    doc: { 
      content: "(title | description | inputs | horizontalRule | paragraph | bulletList | tool)+" 
    },
    
    // Nodes from before.json and after.json
    title: {
      content: "text*",
      group: "block",
      attrs: { 
        dragHandlesDisabled: { default: true },
        level: { default: 1 }
      },
      toDOM() { return ["h1", 0] }
    },
    description: {
      content: "paragraph*",
      group: "block",
      attrs: { 
        dragHandlesDisabled: { default: true }
      },
      toDOM() { return ["div", { class: "description" }, 0] }
    },
    inputs: {
      content: "input*", 
      group: "block",
      attrs: { 
        dragHandlesDisabled: { default: true },
        id: { default: "INPUTS" },
        mode: { default: "inputs" }
      },
      toDOM() { return ["div", { class: "inputs" }, 0] }
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
        fromTrigger: { default: false }
      },
      toDOM() { return ["div", { class: "input" }, 0] }
    },
    horizontalRule: {
      group: "block",
      toDOM() { return ["hr"] }
    },
    paragraph: { 
      content: "(text | inline)*", 
      group: "block",
      toDOM() { return ["p", 0] }
    },
    bulletList: {
      content: "listItem+",
      group: "block",
      toDOM() { return ["ul", 0] }
    },
    listItem: {
      content: "paragraph+",
      toDOM() { return ["li", 0] }
    },
    mention: {
      group: "inline",
      inline: true,
      attrs: {
        referenceId: { default: "" },
        path: { default: "" },
        lastType: { default: "" },
        lastStrictType: { default: null },
        lastLabel: { default: "" }
      },
      toDOM() { return ["span", { class: "mention" }, 0] }
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
        stopBefore: { default: "[\"\",\"\",\"\",\"\"]" },
        responseModel: { default: "{}" }
      },
      toDOM() { return ["span", { class: "generation" }, 0] }
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
        state: { default: null }
      },
      toDOM() { return ["div", { class: "tool" }, 0] }
    },
    text: { 
      group: "inline" 
    }
  },
  
  marks: {
    strong: {
      toDOM() { return ["strong", 0] }
    },
    em: {
      toDOM() { return ["em", 0] }
    },
    italic: {
      toDOM() { return ["em", 0] }
    }
  }
});