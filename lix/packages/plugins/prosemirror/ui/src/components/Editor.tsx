import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { idPlugin } from "../prosemirror/id-plugin";
import { schema } from "../prosemirror/schema";
import { lixProsemirror } from "../prosemirror/lix-plugin";
import { useEffect, useRef, useState } from "react";
import {
	selectProsemirrorDocument,
	selectCurrentVersion,
	selectActiveAccount,
	selectVersions,
} from "../queries";
import { useQuery } from "../hooks/useQuery";
import { lix } from "../state";
import { createVersion, switchVersion } from "@lix-js/sdk";

const Editor: React.FC = () => {
	const [docInLix] = useQuery(selectProsemirrorDocument);
	const [currentVersion] = useQuery(selectCurrentVersion);
	const [activeAccount] = useQuery(selectActiveAccount);
	const [versions] = useQuery(selectVersions);
	const editorRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<EditorView | null>(null);

	// Initialize editor
	useEffect(() => {
		if (!editorRef.current) return;

		// Create plugins array including our custom plugins
		const plugins = [
			history(),
			keymap(baseKeymap),
			idPlugin,
			lixProsemirror({ lix }),
		];

		// Create the editor state
		const state = EditorState.create({
			doc: schema.nodeFromJSON(docInLix ?? { type: "doc", content: [] }),
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

	// Handle clicks to focus the editor
	const handleClick = () => {
		if (view && !view.hasFocus()) {
			view.focus();
		}
	};

	// Handle version change
	const handleVersionChange = async (versionId: string) => {
		try {
			await switchVersion({ lix, to: { id: versionId } });
			// focus back to the editor when switching versions
			view?.focus();
		} catch (error) {
			console.error("Error switching version:", error);
		}
	};

	// Handle delete version
	const handleDeleteVersion = async (
		versionId: string,
		e: React.MouseEvent,
	) => {
		// Stop event propagation to prevent triggering version change
		e.stopPropagation();

		try {
			// Delete the version
			await lix.db.deleteFrom("version").where("id", "=", versionId).execute();
			// Focus back to the editor
			view?.focus();
		} catch (error) {
			console.error("Error deleting version:", error);
		}
	};

	// Handle create version
	const handleCreateVersion = async () => {
		const existingVersion = versions?.find(
			(version) => version.name === `${activeAccount?.name}'s Version`,
		);
		if (existingVersion) {
			await switchVersion({ lix, to: { id: existingVersion.id } });
		} else {
			const newVersion = await createVersion({
				lix,
				name: `${activeAccount?.name}'s Version`,
				from: { id: currentVersion!.id },
			});
			await switchVersion({ lix, to: { id: newVersion.id } });
		}
		// focus back to the editor when switching versions
		view?.focus();
	};

	return (
		<div className="editor-container">
			{/* Tab selector for write/proposed modes */}
			<div className="mode-tabs">
				{versions?.map((version) => (
					<div className="flex items-center" key={version.id}>
						<button
							className={`mode-tab ${version.id === currentVersion?.id ? "active" : ""}`}
							onClick={() => handleVersionChange(version.id)}
						>
							{version.name}
						</button>
					</div>
				))}

				<button className="mode-tab" onClick={handleCreateVersion}>
					+ Version
				</button>
			</div>

			<div className="editor-wrapper" onClick={handleClick}>
				{/* The actual editor will be mounted here */}
				<div ref={editorRef} className="editor" />
			</div>
		</div>
	);
};

export default Editor;
