import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { idPlugin } from "../prosemirror/id-plugin";
import { schema } from "../prosemirror/schema";
import { lixProsemirror } from "../prosemirror/lix-plugin";
import { useEffect, useRef, useState } from "react";
import { selectProsemirrorDocument } from "../queries";
import { useQuery } from "../hooks/useQuery";
import { initialDoc, lix } from "../state";

const Editor: React.FC = () => {
	const [docInLix] = useQuery(selectProsemirrorDocument);
	const editorRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<EditorView | null>(null);

	// Initialize editor
	useEffect(() => {
		if (!editorRef.current) return;

		// Create the initial state
		const state = EditorState.create({
			doc: schema.nodeFromJSON(docInLix || initialDoc),
			plugins: [
				history(),
				keymap(baseKeymap),
				idPlugin,
				lixProsemirror({
					lix,
				}),
			],
		});

		// Create the editor view
		const editorView = new EditorView(editorRef.current, {
			state,
			editable: () => true,
			dispatchTransaction: (transaction) => {
				const newState = editorView.state.apply(transaction);
				editorView.updateState(newState);
			},
		});

		// Set the view
		setView(editorView);

		// Focus the editor
		setTimeout(() => {
			editorView.focus();
		}, 100);

		// Clean up the editor on unmount
		return () => {
			editorView.destroy();
			setView(null);
		};
	}, []);

	// Handle clicks to focus the editor
	const handleClick = () => {
		if (view && !view.hasFocus()) {
			view.focus();
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div className="editor-wrapper" onClick={handleClick}>
				{/* The actual editor will be mounted here */}
				<div ref={editorRef} />
			</div>
		</div>
	);
};

export default Editor;
