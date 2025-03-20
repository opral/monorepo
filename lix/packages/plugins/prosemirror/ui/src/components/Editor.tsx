import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { history } from "prosemirror-history";
import { idPlugin } from "../prosemirror/id-plugin";
import { schema } from "../prosemirror/schema";
import { lixProsemirror } from "../prosemirror/lix-plugin";
import {
	selectProsemirrorDocument,
	selectCurrentVersion,
	selectActiveAccount,
} from "../queries";
import { useQuery } from "../hooks/useQuery";
import { lix } from "../state";
import { createVersion, switchVersion } from "@lix-js/sdk";
import React, { useEffect, useRef, useState } from "react";
import VersionSelector from "./VersionSelector";

const Editor: React.FC = () => {
	const [docInLix] = useQuery(selectProsemirrorDocument);
	const [currentVersion] = useQuery(selectCurrentVersion);
	const [activeAccount] = useQuery(selectActiveAccount);
	const editorRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<EditorView | null>(null);
	const [currentMode, setCurrentMode] = useState<string>("write");

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

	// Handle mode change
	const handleModeChange = async () => {
		// If switching to proposed changes mode
		if (currentMode === "write") {
			try {
				// Get the user's first name
				const accountName = activeAccount?.name || "User";
				const firstName = accountName.split(" ")[0];
				const userVersionName = `${firstName}'s changes`;

				// Check if a version with the user's name already exists
				const versions = await lix.db
					.selectFrom("version")
					.select(["id", "name"])
					.execute();
				const userVersion = versions.find((v) => v.name === userVersionName);

				// Use existing version or create a new one
				const targetVersionId = userVersion
					? userVersion.id
					: (await createVersion({
							lix,
							name: userVersionName,
							from: currentVersion ? { id: currentVersion.id } : undefined,
					  })).id;

				// Switch to the user's version
				await switchVersion({ lix, to: { id: targetVersionId } });

				// Update the mode
				setCurrentMode("proposed");
			} catch (error) {
				console.error("Error creating new version:", error);
				return; // Don't proceed with mode change if version creation fails
			}
		} else {
			// If switching back to write mode
			try {
				// Get the main version
				const versions = await lix.db
					.selectFrom("version")
					.select(["id", "name"])
					.execute();
				const mainVersion = versions.find((v) => v.name === "main");

				if (mainVersion) {
					// Switch to the main version
					await switchVersion({ lix, to: { id: mainVersion.id } });

					// Update the mode
					setCurrentMode("write");
				} else {
					console.warn("Main version not found");
				}
			} catch (error) {
				console.error("Error switching to main version:", error);
			}
		}
	};

	// Handle version change
	const handleVersionChange = async (versionId: string) => {
		try {
			await switchVersion({ lix, to: { id: versionId } });

			// Update the mode
			setCurrentMode("write");
		} catch (error) {
			console.error("Error switching versions:", error);
		}
	};

	return (
		<div className="editor-container">
			{/* Tab selector for write/proposed modes */}
			<div className="mode-tabs">
				<button
					className={`mode-tab ${currentMode === "write" ? "active" : ""}`}
					onClick={handleModeChange}
				>
					Write
				</button>
				<button
					className={`mode-tab ${currentMode === "proposed" ? "active" : ""}`}
					onClick={handleModeChange}
				>
					Propose Changes
				</button>

				{/* Version selector component */}
				<VersionSelector onVersionChange={handleVersionChange} />
			</div>

			<div className="editor-wrapper" onClick={handleClick}>
				{/* The actual editor will be mounted here */}
				<div ref={editorRef} className="editor" />
			</div>
		</div>
	);
};

export default Editor;
