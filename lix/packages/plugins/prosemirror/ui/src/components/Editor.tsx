import React, { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { history } from "prosemirror-history";
import { idPlugin } from "../prosemirror/id-plugin";
import { schema } from "../prosemirror/schema";

interface EditorProps {
	onChange: (doc: any) => void;
	externalDoc: any; // External document to update the editor with
}

const Editor: React.FC<EditorProps> = ({ onChange, externalDoc }) => {
	const editorRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<EditorView | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	// Create editor only once on initial mount
	useEffect(() => {
		// Skip if no DOM element to mount to or if externalDoc is null
		if (!editorRef.current || externalDoc === null) {
			console.log("Editor DOM ref not ready or doc is null, waiting...");
			return;
		}

		// Only create the editor if we don't have one yet
		if (view) {
			console.log("Editor view already exists, not recreating");
			return;
		}

		console.log("CREATING NEW PROSEMIRROR EDITOR");

		// Create a safe initial document
		let docToUse = externalDoc;
		if (!docToUse || typeof docToUse !== "object" || !docToUse.type) {
			console.log("FALLBACK: Using default empty document");
			docToUse = {
				type: "doc",
				content: [],
			};
		} else {
			console.log("INIT: Using provided document:", JSON.stringify(docToUse));
		}

		// Create plugins array including our custom ID plugin
		const plugins = [history(), keymap(baseKeymap), idPlugin];

		// Safely create the document - handle any parsing errors
		let doc;
		try {
			doc = schema.nodeFromJSON(docToUse);
		} catch (error) {
			console.error("Error parsing initial document:", error);
			doc = schema.nodes.doc.createAndFill()!;
		}

		// Create the editor state
		const state = EditorState.create({
			doc,
			plugins,
		});

		// Create the editor view with a custom update function
		const newView = new EditorView(editorRef.current, {
			state,
			editable: () => true,
			dispatchTransaction: (transaction) => {
				// Store the current selection before applying the transaction
				// const prevSelection = newView.state.selection;
				
				// Apply the transaction to create a new state
				const newState = newView.state.apply(transaction);
				
				// When the document changes, notify parent component
				if (transaction.docChanged) {
					// Store the document changes immediately
					// This is important for state management
					onChange(newState.doc.toJSON());
					
					// Store information that the user is currently editing
					// This will be used to prevent external updates from disrupting editing
					window.lastEditTime = Date.now();
				}
				
				// Update the editor view
				newView.updateState(newState);
			},
		});

		// Store the view in state
		setView(newView);
		setIsInitialized(true);

		// Cleanup on unmount
		return () => {
			if (newView) {
				newView.destroy();
			}
		};
	}, []);

	// Update editor content when externalDoc changes
	useEffect(() => {
		// Only update if we have a view and a document
		if (!view || !externalDoc || !isInitialized) return;
		
		// First check: is the user currently editing?
		// Use the global lastEditTime flag we set in the dispatchTransaction
		if (window.lastEditTime && Date.now() - window.lastEditTime < 10000) {
			console.log("Skipping document update because user is actively editing");
			return; // Skip updates entirely while user is editing (10 second window)
		}

		// Second check: is the document truly different?
		// Compare JSON to see if an update is even necessary
		const currentDoc = view.state.doc.toJSON();
		const currentDocJson = JSON.stringify(currentDoc);
		const newDocJson = JSON.stringify(externalDoc);
		
		if (currentDocJson === newDocJson) {
			console.log("Documents are identical, skipping update");
			return;
		}
		
		// If we got here, updates are needed and user isn't actively editing
		console.log("Safe to update editor with external content");
		
		try {
			// Cache current state that we need to preserve
			const hasFocus = view.hasFocus();
			
			// Create a document node from the external document
			const newDoc = schema.nodeFromJSON(externalDoc);
			
			// Create a completely new editor state
			const newState = EditorState.create({
				doc: newDoc,
				plugins: view.state.plugins,
			});
			
			// Update the editor view with the new state
			// Don't try to preserve selection - this is causing the jump
			view.updateState(newState);
			
			// If the editor had focus, refocus it (at the START)
			// This is intended - better to reliably position cursor at start
			// than to jump unpredictably
			if (hasFocus) {
				view.focus();
			}
		} catch (error) {
			console.error("Failed to update editor with external doc:", error);
		}
	}, [view, externalDoc, isInitialized]);

	// Click handler for editor focus
	const handleClick = () => {
		if (view && !view.hasFocus()) {
			view.focus();
		}
	};

	return (
		<div className="editor-container">
			<div className="toolbar"></div>

			<div
				className="editor-wrapper"
				onClick={handleClick}
				style={{
					position: "relative",
					zIndex: 1,
				}}
			>
				{/* The actual editor will be mounted here */}
				<div
					ref={editorRef}
					className="editor"
					style={{
						minHeight: "150px",
						position: "relative",
						zIndex: 2,
					}}
				/>
			</div>
		</div>
	);
};

export default Editor;