import React, { useEffect, useRef, useState } from 'react';
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

	// Initialize editor
	useEffect(() => {
		if (!editorRef.current) return;

		// Choose which doc to use
		const initialDoc = externalDoc;

		// Create plugins array including our custom ID plugin
		const plugins = [history(), keymap(baseKeymap), idPlugin];

		// Create the editor state
		const state = EditorState.create({
			doc: schema.nodeFromJSON(initialDoc),
			plugins,
		});

		// Create the editor view
		const view = new EditorView(editorRef.current, {
			state,
			editable: () => true,
			dispatchTransaction: (transaction) => {
				// Apply the transaction to create a new state
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

		// Clean up on unmount
		return () => {
			view.destroy();
		};
	}, []);

	// Update editor when externalDoc changes
	useEffect(() => {
		if (view && externalDoc && externalDoc.type === "doc") {
			try {
				// Create a transaction to replace the document
				const tr = view.state.tr;

				// Create a new document from JSON
				const newDoc = schema.nodeFromJSON(externalDoc);

				// Replace the current document
				tr.replaceWith(0, view.state.doc.content.size, newDoc.content);

				// Apply the transaction
				view.dispatch(tr);
			} catch (error) {
				console.error("Error updating document:", error);
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