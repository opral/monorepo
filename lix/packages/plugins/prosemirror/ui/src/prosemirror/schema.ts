import { Schema } from "prosemirror-model";

// Define a schema that supports basic content including lists
// We need to define a schema for ProseMirror to work with
export const schema = new Schema({
  nodes: {
    // The top level document node
    doc: { 
      content: "block+" 
    },
    
    // Basic block nodes
    paragraph: { 
      content: "inline*", 
      group: "block",
      attrs: { id: { default: "" } },
      toDOM() { return ["p", 0] }
    },
    heading: {
      content: "inline*",
      group: "block",
      attrs: { 
        level: { default: 1 },
        id: { default: "" }
      },
      toDOM(node) { return [`h${node.attrs.level}`, 0] }
    },
    
    // List nodes
    bullet_list: {
      content: "list_item+",
      group: "block",
      toDOM() { return ["ul", 0] }
    },
    list_item: {
      content: "paragraph block*",
      defining: true,
      toDOM() { return ["li", 0] }
    },
    
    // Inline content
    text: { 
      group: "inline" 
    }
  },
  
  // Basic formatting marks
  marks: {
    strong: {
      toDOM() { return ["strong", 0] }
    },
    em: {
      toDOM() { return ["em", 0] }
    }
  }
});