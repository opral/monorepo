import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { history } from "prosemirror-history";
import { idPlugin } from "../prosemirror/id-plugin";
import { schema } from "../prosemirror/schema";
import {
	selectProsemirrorDocument,
	selectCurrentVersion,
	selectActiveAccount,
} from "../queries";
import { useQuery } from "../hooks/useQuery";
import { lix } from "../state";
import { useDebounceCallback } from "usehooks-ts";
import VersionSelector from "./VersionSelector";
import { switchVersion, createVersion } from "@lix-js/sdk";

const Editor: React.FC = () => {
	const [docInLix] = useQuery(selectProsemirrorDocument);
	const [currentVersion] = useQuery(selectCurrentVersion);
	const [activeAccount] = useQuery(selectActiveAccount);
	const editorRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<EditorView | null>(null);
	const [currentMode, setCurrentMode] = useState<string>("write");

	/**
	 * Write the current document to Lix.
	 *
	 * This function is debounced to prevent too many writes which leads
	 * to many changes.
	 */
	const writeDocToLix = useDebounceCallback((newState: EditorState) => {
		const fileData = new TextEncoder().encode(
			JSON.stringify(newState.doc.toJSON()),
		);

		lix.db
			.insertInto("file")
			.values({
				path: "/prosemirror.json",
				data: fileData,
			})
			.onConflict((oc) =>
				oc.doUpdateSet({
					data: fileData,
				}),
			)
			.execute();
	}, 400);

	// Initialize editor
	useEffect(() => {
		if (!editorRef.current) return;

		// Create plugins array including our custom ID plugin
		const plugins = [history(), keymap(baseKeymap), idPlugin];

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

				// Write the new document to Lix
				writeDocToLix(newState);
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
		if (view) {
			try {
				// Create a transaction to replace the document
				const tr = view.state.tr;

				// Create a new document from JSON
				const newDoc = schema.nodeFromJSON(
					docInLix ?? { type: "doc", content: [] },
				);

				// Replace the current document
				tr.replaceWith(0, view.state.doc.content.size, newDoc.content);

				// Apply the transaction
				view.dispatch(tr);
			} catch (error) {
				console.error("Error updating document:", error);
			}
		}
	}, [view]);

	// Listen for checkpoint application events
	useEffect(() => {
		if (!view) return;

		// Define event handler for checkpoint application
		const handleApplyCheckpoint = async () => {
			console.log("Checkpoint application detected, updating editor...");

			try {
				// Get the latest document from the database
				const latest = await selectProsemirrorDocument();

				if (latest && view) {
					// Create a transaction to replace the document
					const tr = view.state.tr;

					// Create a new document from the updated data
					const newDoc = schema.nodeFromJSON(	
						latest ?? { type: "doc", content: [] },
					);

					// Replace the current document
					tr.replaceWith(0, view.state.doc.content.size, newDoc.content);

					// Apply the transaction
					view.dispatch(tr);

					console.log("Editor successfully updated with checkpoint changes");
				}
			} catch (error) {
				console.error("Error applying checkpoint changes to editor:", error);
			}
		};

		// Add event listener
		window.addEventListener("apply-checkpoint", handleApplyCheckpoint);

		// Clean up
		return () => {
			window.removeEventListener("apply-checkpoint", handleApplyCheckpoint);
		};
	}, [view]);

	// Handle clicks to focus the editor
	const handleClick = () => {
		if (view && !view.hasFocus()) {
			view.focus();
		}
	};

	// Toggle between write and propose modes
	const toggleMode = async () => {
		if (!view) return;

		// If we're switching to propose mode, create a new version or switch to existing user version
		if (currentMode === "write") {
			try {
				// Get the account name or use a default
				const accountName = activeAccount?.name || "user";
				// Use the first name if there's a space in the name
				const firstName = accountName.split(" ")[0].toLowerCase();
				const userVersionName = `${firstName}-changes`;

				// Check if a version with this name already exists
				const existingVersions = await lix.db
					.selectFrom("version")
					.select(["id", "name"])
					.execute();

				const userVersion = existingVersions.find(
					(v) => v.name === userVersionName,
				);

				let targetVersionId: string;

				if (userVersion) {
					// Use the existing user version
					targetVersionId = userVersion.id;
					console.log(
						`Using existing version for ${firstName}: ${userVersionName}`,
					);
				} else {
					// Create a new version with the user's name
					const newVersion = await createVersion({
						lix,
						name: userVersionName,
						from: currentVersion ? { id: currentVersion.id } : undefined,
					});
					targetVersionId = newVersion.id;
					console.log(
						`Created new version for ${firstName}: ${userVersionName}`,
					);
				}

				// Switch to the user's version
				await switchVersion({ lix, to: { id: targetVersionId } });

				// Reload the document from the database after switching versions
				const latest = await selectProsemirrorDocument();

				if (latest && view) {
					// Create a transaction to replace the document
					const tr = view.state.tr;

					// Create a new document from the updated data
					const newDoc = schema.nodeFromJSON(latest);

					// Replace the current document
					tr.replaceWith(0, view.state.doc.content.size, newDoc.content);

					// Apply the transaction
					view.dispatch(tr);

					console.log(
						`Editor successfully updated after switching to ${userVersionName} version`,
					);
				}
			} catch (error) {
				console.error("Error creating new version:", error);
				return; // Don't proceed with mode change if version creation fails
			}
		} else if (currentMode === "proposed") {
			// If switching back to write mode, switch to the main version
			try {
				// Get all versions
				const allVersions = await lix.db
					.selectFrom("version")
					.select(["id", "name"])
					.execute();

				// Find the main version (usually named "main")
				const mainVersion = allVersions.find((v) => v.name === "main");

				if (mainVersion) {
					// Switch to the main version
					await switchVersion({ lix, to: { id: mainVersion.id } });

					// Reload the document from the database after switching versions
					const latest = await selectProsemirrorDocument();

					if (latest && view) {
						// Create a transaction to replace the document
						const tr = view.state.tr;

						// Create a new document from the updated data
						const newDoc = schema.nodeFromJSON(latest);

						// Replace the current document
						tr.replaceWith(0, view.state.doc.content.size, newDoc.content);

						// Apply the transaction
						view.dispatch(tr);

						console.log(
							"Editor successfully updated after switching to main version",
						);
					}
				} else {
					console.warn("Main version not found");
				}
			} catch (error) {
				console.error("Error switching to main version:", error);
			}
		}

		// Update the mode
		const newMode = currentMode === "proposed" ? "write" : "proposed";
		setCurrentMode(newMode);
	};

	// Handle version change
	const handleVersionChange = async (versionId: string) => {
		try {
			await switchVersion({ lix, to: { id: versionId } });

			// Reload the document from the database after switching versions
			const latest = await selectProsemirrorDocument();

			if (latest && view) {
				// Create a transaction to replace the document
				const tr = view.state.tr;

				// Create a new document from the updated data
				const newDoc = schema.nodeFromJSON(latest);

				// Replace the current document
				tr.replaceWith(0, view.state.doc.content.size, newDoc.content);

				// Apply the transaction
				view.dispatch(tr);

				console.log("Editor successfully updated after version change");
			}
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
					onClick={toggleMode}
				>
					Write
				</button>
				<button
					className={`mode-tab ${currentMode === "proposed" ? "active" : ""}`}
					onClick={toggleMode}
				>
					Propose Changes
				</button>

				{/* Version selector component */}
				<VersionSelector onVersionChange={handleVersionChange} />
			</div>

			<div className="editor-wrapper" onClick={handleClick}>
				{/* The actual editor will be mounted here */}
				<div ref={editorRef} className="editor" />

				{/* Mode indicator */}
				<div className="mode-indicator">
					{currentMode === "write" ? "Write Mode" : "Propose Changes Mode"}
					<span className="version-info">Version: {currentVersion?.name}</span>
				</div>
			</div>
		</div>
	);
};

export default Editor;