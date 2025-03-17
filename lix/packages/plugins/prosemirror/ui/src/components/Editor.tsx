import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history } from 'prosemirror-history';

// Create a very basic schema with _id attributes for change detection
const schema = new Schema({
  nodes: {
    doc: {
      content: 'paragraph+',
      attrs: { _id: { default: null } }
    },
    paragraph: {
      content: 'text*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM() { return ['p', 0] },
      attrs: { _id: { default: null } }
    },
    text: {
      group: 'inline'
    }
  },
  marks: {}
});

interface EditorProps {
  onChange: (doc: any) => void;
  externalDoc?: any; // External document to update the editor with
}

const Editor: React.FC<EditorProps> = ({ onChange, externalDoc }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<EditorView | null>(null);

  useEffect(() => {
    // Only run once on component mount
    if (!editorRef.current) return;
    
    console.log("Creating editor...");

    // Get the initial document - either from props or create a default one
    let initialDoc;
    
    // Use fixed IDs to ensure consistency
    // These IDs will remain the same throughout the editor's lifetime
    const FIXED_DOC_ID = "doc-1";
    const FIXED_PARAGRAPH_ID = "p-1";
    
    if (externalDoc && Object.keys(externalDoc).length > 0) {
      console.log("Using external document for initialization");
      try {
        // When importing from externalDoc, preserve the existing IDs
        initialDoc = schema.nodeFromJSON(externalDoc);
        
        // If the external doc doesn't have IDs, add them using our fixed IDs
        if (!initialDoc.attrs || !initialDoc.attrs._id) {
          initialDoc.attrs = { ...initialDoc.attrs, _id: FIXED_DOC_ID };
        }
      } catch (error) {
        console.error("Error parsing external document:", error);
        // Fallback to default document with fixed IDs
        initialDoc = schema.node("doc", { _id: FIXED_DOC_ID }, [
          schema.node("paragraph", { _id: FIXED_PARAGRAPH_ID }, [
            schema.text("Type here...")
          ])
        ]);
      }
    } else {
      // Create a default document with fixed IDs
      console.log("Creating default document with fixed IDs");
      initialDoc = schema.node("doc", { _id: FIXED_DOC_ID }, [
        schema.node("paragraph", { _id: FIXED_PARAGRAPH_ID }, [
          schema.text("Type here...")
        ])
      ]);
    }

    // Create plugins array including an ID plugin for the change detector
    const plugins = [
			history(),
			keymap(baseKeymap),

			// Add ID plugin to ensure every node has stable, permanent IDs
			new Plugin({
				// This key lets us identify our plugin in the state
				key: new PluginKey("idPlugin"),

				// The appendTransaction method runs after a transaction is applied
				appendTransaction: (transactions, _, newState) => {
					// Only run if the document has changed
					if (!transactions.some((tr) => tr.docChanged)) return null;

					let tr = newState.tr;
					let modified = false;

					// Use fixed prefix for stable IDs
					const FIXED_DOC_ID = "doc-1";
					const fixedPrefixes = {
						doc: "doc",
						paragraph: "p",
						heading: "h",
						blockquote: "bq",
						code_block: "code",
						bullet_list: "bl",
						ordered_list: "ol",
						list_item: "li",
						horizontal_rule: "hr",
						image: "img",
					};

					// Track existing IDs to avoid duplicates
					const existingIds = {};
					const idCounter = {
						// Start counters for each node type
						doc: 1,
						paragraph: 1,
						heading: 1,
						blockquote: 1,
						code_block: 1,
						// Add others as needed
					};

					// First check the doc ID - always use FIXED_DOC_ID for consistency
					if (!newState.doc.attrs || !newState.doc.attrs._id) {
						tr = tr.setNodeAttribute(0, "_id", FIXED_DOC_ID);
						modified = true;
					} else if (newState.doc.attrs._id !== FIXED_DOC_ID) {
						// Ensure the doc ID is always FIXED_DOC_ID
						tr = tr.setNodeAttribute(0, "_id", FIXED_DOC_ID);
						modified = true;
					}
					existingIds[FIXED_DOC_ID] = true;

					// Create a function to generate a stable ID for a node
					const generateStableId = (nodeType) => {
						const prefix = fixedPrefixes[nodeType] || nodeType;
						const id = `${prefix}-${idCounter[nodeType] || 1}`;

						// Increment counter for this node type
						idCounter[nodeType] = (idCounter[nodeType] || 1) + 1;

						return id;
					};

					// Now check all non-text nodes for IDs and add them if missing
					newState.doc.descendants((node, pos) => {
						if (node.isText) return; // Skip text nodes

						if (node.attrs) {
							if (node.attrs._id) {
								// If it has an ID, just record it to avoid duplicates
								existingIds[node.attrs._id] = true;
							} else {
								// If it doesn't have an ID, add a stable one
								const id = generateStableId(node.type.name);
								tr = tr.setNodeAttribute(pos, "_id", id);
								existingIds[id] = true;
								modified = true;
							}
						}
					});

					// Only return the transaction if we made changes
					return modified ? tr : null;
				},
			}),
		];
    
    // Set up the editor state with our plugins and initial document
    const state = EditorState.create({
      schema,
      doc: initialDoc, // Use the document we created with IDs
      plugins
    });

    // Create the editor view with a transaction handler
    const view = new EditorView(editorRef.current, {
      state,
      // IMPORTANT: Make sure it's editable
      editable: () => true, 
      // Handle transactions (changes to the document)
      dispatchTransaction: transaction => {
        // Get the updated state by applying the transaction
        const newState = view.state.apply(transaction);
        
        // Update the editor view
        view.updateState(newState);
        
        // Notify parent component of changes
        if (transaction.docChanged) {
          console.log("Document changed!");
          onChange(newState.doc.toJSON());
        }
      }
    });

    // Store the view in state
    setView(view);
    
    // Focus the editor
    setTimeout(() => {
      view.focus();
      console.log("Editor focused");
    }, 100);

    // Clean up the editor when component unmounts
    return () => {
      console.log("Destroying editor");
      view.destroy();
    };
  }, []);

  // Effect to update editor when externalDoc changes
  useEffect(() => {
    if (view && externalDoc) {
      try {
        console.log("Updating editor with external document:", externalDoc);
        
        // Create a new document from the external state
        // Important: Use setNodeMarkup to preserve externalDoc attrs including _id values
        const newDocNode = schema.nodeFromJSON(externalDoc);
        
        // Create a transaction that replaces the entire document
        const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, newDocNode.content);
        
        // Apply the transaction to update the editor
        view.dispatch(tr);
        
        console.log("Editor updated with external document");
      } catch (error) {
        console.error("Error updating editor with external document:", error);
      }
    }
  }, [view, externalDoc]);
  
  // Handle clicks to focus the editor
  const handleClick = () => {
    console.log("Click on editor container");
    if (view && !view.hasFocus()) {
      view.focus();
      console.log("Editor focused after click");
    }
  };

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button onClick={() => console.log(view?.state.doc.toJSON())}>
          Debug
        </button>
      </div>
      
      <div 
        className="editor-wrapper" 
        onClick={handleClick}
        style={{
          border: '2px solid #ccc',
          borderRadius: '4px',
          padding: '5px',
          cursor: 'text',
          backgroundColor: '#fff'
        }}
      >
        {/* The actual editor will be mounted here */}
        <div 
          ref={editorRef} 
          className="editor"
          style={{ minHeight: '150px' }}
        />
      </div>
      
      <div style={{ marginTop: '10px', color: '#666' }}>
        <strong>Click in the box above to start typing</strong>
      </div>
    </div>
  );
};

export default Editor;