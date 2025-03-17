import { Schema } from "prosemirror-model";

// Define a minimal schema that supports basic content
// We need to define a schema for ProseMirror to work with
// but we keep it minimal to focus on document structure
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
      attrs: { _id: { default: "" } },
      toDOM() { return ["p", 0] }
    },
    heading: {
      content: "inline*",
      group: "block",
      attrs: { 
        level: { default: 1 },
        _id: { default: "" }
      },
      toDOM(node) { return [`h${node.attrs.level}`, 0] }
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