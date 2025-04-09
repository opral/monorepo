import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { idPlugin } from "../prosemirror/id-plugin";
import { schema } from "../prosemirror/schema";
import { lixProsemirror } from "../prosemirror/lix-plugin";
import { useEffect, useRef, useState } from "react";
import { prosemirrorFile, lix } from "../state";
import { registerCustomNodeViews } from "../prosemirror/custom-node-views";
import { useKeyValue } from "../hooks/useKeyValue";
import { DiffView } from "./DiffView";

// Custom styles for the ProseMirror editor
const editorStyles = `
  .ProseMirror {
    font-size: 0.875rem; /* text-sm */
  }
  
  .ProseMirror p {
    font-size: 0.875rem; /* text-sm */
    margin-bottom: 0.5rem;
  }
  
  .ProseMirror h1 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }
`;

const Editor: React.FC = () => {
	const editorRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<EditorView | null>(null);
	const [diffView] = useKeyValue<{
		beforeCsId?: string;
		afterCsId?: string;
	} | null>("diffView");

	// Initialize editor using useEffect for proper lifecycle management
	useEffect(() => {
		// Ensure the ref is attached
		if (!editorRef.current) {
			return;
		}

		// Create the initial state with an EMPTY document
		// The lixProsemirror plugin will load the actual document
		const state = EditorState.create({
			doc: schema.nodeFromJSON(
				JSON.parse(new TextDecoder().decode(prosemirrorFile.data)),
			),
			schema,
			plugins: [
				history(),
				keymap(baseKeymap),
				idPlugin,
				lixProsemirror({
					lix,
					fileId: prosemirrorFile.id,
				}),
			],
		});

		// Create the editor view
		const editorView = new EditorView(editorRef.current, {
			state,
			editable: () => true,
			dispatchTransaction: (transaction) => {
				// Get the latest state and apply the transaction
				const newState = editorView.state.apply(transaction);
				editorView.updateState(newState);
			},
		});

		// Register custom node views after editorView is created
		editorView.setProps({
			nodeViews: registerCustomNodeViews(editorView),
		});

		// Set the view in state
		setView(editorView);

		// Focus the editor
		setTimeout(() => {
			editorView.focus();
		}, 100);

		// Clean up the editor on component unmount
		return () => {
			editorView.destroy();
			setView(null);
		};
	}, []); // Empty dependency array ensures this runs only once on mount

	// Handle clicks to focus the editor
	const handleClick = () => {
		if (view && !view.hasFocus()) {
			view.focus();
		}
	};

	return (
		<div className="flex flex-col h-full">
			<style>{editorStyles}</style>
			<div className="editor-wrapper p-4" onClick={handleClick}>
				{/* The actual editor will be mounted here */}
				{diffView ? (
					<DiffView />
				) : (
					<div ref={editorRef} className="prose max-w-none text-sm" />
				)}
			</div>
		</div>
	);
};

export default Editor;
