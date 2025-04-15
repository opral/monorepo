import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark, chainCommands } from "prosemirror-commands";
import {
	wrapInList,
	splitListItem,
	liftListItem,
	sinkListItem,
} from "prosemirror-schema-list";
import { schema } from "../prosemirror/schema";
import { useEffect, useRef, useState } from "react";
import { prosemirrorFile, lix } from "../state";
import { registerCustomNodeViews } from "../prosemirror/custom-node-views";
import { useKeyValue } from "../hooks/useKeyValue";
import { DiffView } from "./DiffView";
import Toolbar from "./Toolbar";
import { idPlugin, lixProsemirror } from "@lix-js/plugin-prosemirror";

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
				keymap({
					...baseKeymap,
					// Add bold/italic/list keybindings
					"Mod-b": toggleMark(schema.marks.strong),
					"Mod-B": toggleMark(schema.marks.strong), // Handle Shift
					"Mod-i": toggleMark(schema.marks.em),
					"Mod-I": toggleMark(schema.marks.em), // Handle Shift
					"Shift-Ctrl-8": wrapInList(schema.nodes.bulletList), // Common shortcut for bullet list
					Enter: chainCommands(
						splitListItem(schema.nodes.listItem),
						baseKeymap.Enter,
					), // Chain list split with default Enter
					Tab: sinkListItem(schema.nodes.listItem), // Indent list item
					"Shift-Tab": liftListItem(schema.nodes.listItem), // Outdent list item
				}),
				idPlugin(),
				lixProsemirror({
					lix,
					schema,
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
			<Toolbar view={view} />
			<div className="editor-wrapper p-4 relative" onClick={handleClick}>
				{/* The editor is always mounted but hidden when diff view is active */}
				<div
					ref={editorRef}
					className="prose max-w-none text-sm"
					style={{ display: diffView ? "none" : "block" }}
				/>

				{/* Diff view with the same structure the p-2 is needed to match the editor */}
				<div
					className="prose max-w-none text-sm p-2"
					style={{ display: diffView ? "block" : "none" }}
				>
					{diffView && <DiffView />}
				</div>
			</div>
		</div>
	);
};

export default Editor;
