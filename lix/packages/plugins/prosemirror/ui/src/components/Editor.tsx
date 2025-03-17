import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from "prosemirror-state";
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history } from 'prosemirror-history';
import { idPlugin } from "../prosemirror/id-plugin";

// Create a very basic schema with _id attributes for change detection
const schema = new Schema({
	nodes: {
		doc: {
			content: "paragraph+",
			attrs: { _id: { default: null } },
		},
		paragraph: {
			content: "text*",
			group: "block",
			parseDOM: [{ tag: "p" }],
			toDOM() {
				return ["p", 0];
			},
			attrs: { _id: { default: null } },
		},
		text: {
			group: "inline",
		},
	},
	marks: {},
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

		// Get the initial document - either from props or create a default one
		let initialDoc;

		// Use fixed IDs to ensure consistency
		// These IDs will remain the same throughout the editor's lifetime
		const FIXED_DOC_ID = "doc-1";
		const FIXED_PARAGRAPH_ID = "p-1";

		if (externalDoc && Object.keys(externalDoc).length > 0) {
			try {
				// When importing from externalDoc, preserve the existing IDs
				initialDoc = schema.nodeFromJSON(externalDoc);

				// If the external doc doesn't have IDs, add them using our fixed IDs
				if (!initialDoc.attrs || !initialDoc.attrs._id) {
					initialDoc.attrs = { ...initialDoc.attrs, _id: FIXED_DOC_ID };
				}
			} catch (error) {
				// Fallback to default document with fixed IDs
				initialDoc = schema.node("doc", { _id: FIXED_DOC_ID }, [
					schema.node("paragraph", { _id: FIXED_PARAGRAPH_ID }, [
						schema.text("Type here..."),
					]),
				]);
			}
		} else {
			// Create a default document with fixed IDs
			initialDoc = schema.node("doc", { _id: FIXED_DOC_ID }, [
				schema.node("paragraph", { _id: FIXED_PARAGRAPH_ID }, [
					schema.text("Type here..."),
				]),
			]);
		}

		// Create plugins array including an ID plugin for the change detector
		const plugins = [history(), keymap(baseKeymap), idPlugin];

		// Set up the editor state with our plugins and initial document
		const state = EditorState.create({
			schema,
			doc: initialDoc, // Use the document we created with IDs
			plugins,
		});

		// Create the editor view with a transaction handler
		const view = new EditorView(editorRef.current, {
			state,
			// IMPORTANT: Make sure it's editable
			editable: () => true,
			// Handle transactions (changes to the document)
			dispatchTransaction: (transaction) => {
				// Get the updated state by applying the transaction
				const newState = view.state.apply(transaction);

				// Update the editor view
				view.updateState(newState);

				// Notify parent component of changes
				if (transaction.docChanged) {
					onChange(newState.doc.toJSON());
				}
			},
		});

		// Store the view in state
		setView(view);

		// Focus the editor
		setTimeout(() => {
			view.focus();
		}, 100);

		// Clean up the editor when component unmounts
		return () => {
			view.destroy();
		};
	}, []);

	// Effect to update editor when externalDoc changes
	useEffect(() => {
		if (view && externalDoc) {
			try {
				// Create a new document from the external state
				// Important: Use setNodeMarkup to preserve externalDoc attrs including _id values
				const newDocNode = schema.nodeFromJSON(externalDoc);

				// Create a transaction that replaces the entire document
				const tr = view.state.tr.replaceWith(
					0,
					view.state.doc.content.size,
					newDocNode.content,
				);

				// Apply the transaction to update the editor
				view.dispatch(tr);
			} catch (error) {
				// Error handling for updating editor with external document
			}
		}
	}, [view, externalDoc]);

	// Handle clicks to focus the editor
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
					border: "2px solid #ccc",
					borderRadius: "4px",
					padding: "5px",
					cursor: "text",
					backgroundColor: "#fff",
				}}
			>
				{/* The actual editor will be mounted here */}
				<div
					ref={editorRef}
					className="editor"
					style={{ minHeight: "150px" }}
				/>
			</div>
		</div>
	);
};

export default Editor;