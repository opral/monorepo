import Editor from "./components/Editor";
import ChangesDisplay from "./components/ChangesDisplay";
import LixDebugPanel from "./components/LixDebugPanel";
import CheckpointSidebar from "./components/CheckpointSidebar";
import { useState, useEffect } from "react";
import {
	pollingInterval,
	lixAtom,
	prosemirrorDocumentAtom,
	withPollingAtom,
} from "./state";
import { useDebounceCallback, useInterval } from "usehooks-ts";
import { useAtom, useAtomValue } from "jotai";
import {
	resetOpfs,
	listOpfsFiles,
	saveLixToOpfs,
} from "./helper/saveLixToOpfs";
import { initialDocument } from "./helper/demo-lix-file/demo-lix-file";

// Add typing for window property
declare global {
	interface Window {
		lastEditTime?: number;
	}
}

// Adding static property to App function
interface AppFunction extends Function {
	lastUserEdit?: number;
}

// Static tracking for edits
function App() {
	// Static properties properly typed
	const AppWithStatic = App as AppFunction;
	if (!AppWithStatic.lastUserEdit) {
		AppWithStatic.lastUserEdit = 0;
	}

	// Use jotai atoms
	const lix = useAtomValue(lixAtom);
	const prosemirrorDocument = useAtomValue(prosemirrorDocumentAtom);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [, setPollingTimestamp] = useAtom(withPollingAtom);

	// Use a single source of truth for the document state
	// Initialize with the demo document to ensure there's always content
	const [currentDoc, setCurrentDoc] = useState<any>(initialDocument);
	const [currentVersionId, setCurrentVersionId] = useState<string>("");
	const [showSidebar, setShowSidebar] = useState<boolean>(true);
	const [showAdminMenu, setShowAdminMenu] = useState<boolean>(true);
	const [opfsFiles, setOpfsFiles] = useState<string[]>([]);

	// Update document state when prosemirrorDocument changes from external sources
	useEffect(() => {
		if (prosemirrorDocument) {
			console.log("APP: Document updated from server/OPFS");

			// Prevent rapid document updates when user is editing
			// Only update if the document has changed significantly to avoid focus loss

			// Check if the prosemirror document has content
			const hasContent =
				prosemirrorDocument.content && prosemirrorDocument.content.length > 0;

			// Get current JSON representations for comparison
			const currentDocJson = JSON.stringify(currentDoc);
			const newDocJson = JSON.stringify(prosemirrorDocument);

			// Only update in these cases:
			// 1. Initial load (currentDoc is empty but prosemirrorDocument has content)
			// 2. Major structural changes (significantly different documents)
			// 3. Never update while user is likely editing (avoid cursor jumps)
			const isInitialLoad = currentDoc?.content?.length === 0 && hasContent;
			const hasSignificantChanges =
				currentDocJson !== newDocJson &&
				// Additional check to prevent updates during minor edits - make this threshold higher
				Math.abs(currentDocJson.length - newDocJson.length) > 100;

			// Track when we last received user input to avoid interruptions
			// Using a static variable to track last edit time across renders
			if (!AppWithStatic.lastUserEdit) {
				AppWithStatic.lastUserEdit = 0;
			}

			// Don't update if user was recently editing (within last 5 seconds)
			const isUserCurrentlyEditing =
				Date.now() - AppWithStatic.lastUserEdit < 5000;

			if (isInitialLoad) {
				console.log("APP: Initial document load");
				setCurrentDoc(prosemirrorDocument);
			} else if (hasSignificantChanges && !isUserCurrentlyEditing) {
				console.log(
					"APP: Document has significant changes and user is not editing, updating",
				);
				setCurrentDoc(prosemirrorDocument);
			} else {
				// Log different messages based on the reason we're not updating
				if (isUserCurrentlyEditing) {
					console.log("APP: Not updating because user is currently editing");
				} else {
					console.log(
						"APP: Document has minor changes, not updating to avoid focus loss",
					);
				}
			}
		}
	}, [prosemirrorDocument, currentDoc]);

	// Get the current version ID
	useEffect(() => {
		const fetchCurrentVersion = async () => {
			if (!lix) return;

			try {
				const version = await lix.db
					.selectFrom("version")
					.orderBy("id", "desc")
					.limit(1)
					.selectAll()
					.executeTakeFirst();

				if (version) {
					console.log("Found current version:", version.id);
					setCurrentVersionId(version.id);
				} else {
					console.log("No version found, checking for default version");
					// Try to get the default version
					const defaultVersion = await lix.db
						.insertInto("version")
						.defaultValues()
						.returning("id")
						.executeTakeFirst();

					if (defaultVersion) {
						console.log("Created default version:", defaultVersion.id);
						setCurrentVersionId(defaultVersion.id);
					} else {
						console.error("Could not create a default version");
					}
				}
			} catch (error) {
				console.error("Error fetching current version:", error);
			}
		};

		fetchCurrentVersion();

		// Poll for version changes
		const intervalId = setInterval(fetchCurrentVersion, 1000);
		return () => clearInterval(intervalId);
	}, [lix]);

	// Update polling timestamp at regular intervals, but not when editing
	useInterval(() => {
		// Only poll if user hasn't been active in the last 10 seconds
		if (!window.lastEditTime || Date.now() - window.lastEditTime > 10000) {
			console.log("Regular polling update");
			setPollingTimestamp(Date.now());
		} else {
			console.log("Skipping polling because user is actively editing");
		}
	}, pollingInterval);

	// Debouncing to prevent too many updates
	const handleDocChange = useDebounceCallback((newDoc: any) => {
		if (!lix) return;

		// Update last edit timestamp whenever user makes changes
		// This helps prevent document updates while user is typing
		const AppWithStatic = App as AppFunction;
		AppWithStatic.lastUserEdit = Date.now();

		// Compare with current document to avoid unnecessary updates
		const currentDocJson = JSON.stringify(currentDoc);
		const newDocJson = JSON.stringify(newDoc);

		// Only update if the documents are different
		if (currentDocJson !== newDocJson) {
			console.log("Document changed by user, saving to lix");

			const file = new TextEncoder().encode(JSON.stringify(newDoc));

			lix.db
				.insertInto("file")
				.values({
					path: "/prosemirror.json",
					data: file,
				})
				.onConflict((oc) =>
					oc.doUpdateSet({
						data: file,
					}),
				)
				.execute()
				.then(() => {
					console.log("File saved to lix");
					// Update the polling atom to trigger reactive updates
					// Add a delay to avoid immediate polling which could cause cursor jumps
					setTimeout(() => {
						setPollingTimestamp(Date.now());
					}, 1000);
				})
				.catch((error) => {
					console.error("Error saving file to lix:", error);
				});

			// Do a local update of the document state immediately
			setCurrentDoc(newDoc);
		}
	}, 300);

	// Load OPFS files for the admin menu
	const loadOpfsFiles = async () => {
		const files = await listOpfsFiles();
		setOpfsFiles(files);
	};

	// Toggle admin menu and load OPFS files when opened
	const toggleAdminMenu = async () => {
		const newState = !showAdminMenu;
		setShowAdminMenu(newState);

		if (newState) {
			await loadOpfsFiles();
		}
	};

	// Reset OPFS and reload the page
	const handleResetOpfs = async () => {
		if (
			confirm("Are you sure you want to reset all data? This cannot be undone.")
		) {
			await resetOpfs();
			alert("All data has been cleared. The page will now reload.");
			location.reload();
		}
	};

	// Save current state to OPFS
	const handleSaveToOpfs = async () => {
		if (!lix) return;

		try {
			await saveLixToOpfs({ lix });
			alert("Successfully saved to OPFS");
			await loadOpfsFiles();
		} catch (error) {
			console.error("Error saving to OPFS:", error);
			alert("Error saving to OPFS: " + (error as Error).message);
		}
	};

	// Handle restoring a checkpoint
	const handleRestoreCheckpoint = async (checkpointId: string) => {
		if (!lix) return;

		try {
			console.log("Attempting to restore checkpoint:", checkpointId);
			console.log("Current version ID:", currentVersionId);

			// First, get all changes in the checkpoint set
			const changeSetElements = await lix.db
				.selectFrom("change_set_element")
				.where("change_set_element.change_set_id", "=", checkpointId)
				.select("change_id")
				.execute();

			console.log(
				`Found ${changeSetElements.length} changes in the checkpoint`,
			);

			if (changeSetElements.length === 0) {
				throw new Error("No changes found in this checkpoint");
			}

			// Get the snapshot associated with this checkpoint
			const snapshots = await lix.db
				.selectFrom("change")
				.where(
					"id",
					"in",
					changeSetElements.map((el) => el.change_id),
				)
				.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
				.select("snapshot.content")
				.execute();

			if (snapshots.length === 0) {
				throw new Error("No snapshots found for this checkpoint");
			}

			// Get the latest snapshot
			const restoreSnapshot = snapshots[0];

			// If we have a snapshot, use it; otherwise, use a clean document
			let docToRestore;
			try {
				// Ensure content is a valid Uint8Array before decoding
				const contentData =
					restoreSnapshot?.content instanceof Uint8Array
						? restoreSnapshot.content
						: new Uint8Array(Object.values(restoreSnapshot?.content || {})); // Convert object to Uint8Array

				docToRestore = restoreSnapshot?.content
					? JSON.parse(new TextDecoder().decode(contentData))
					: { type: "doc", content: [] };
			} catch (parseError) {
				console.error("Error parsing snapshot content:", parseError);
				docToRestore = { type: "doc", content: [] };
			}

			console.log("Restoring document from checkpoint");

			// Save the restored document
			const file = new TextEncoder().encode(JSON.stringify(docToRestore));

			await lix.db
				.insertInto("file")
				.values({
					path: "/prosemirror.json",
					data: file,
				})
				.onConflict((oc) =>
					oc.doUpdateSet({
						data: file,
					}),
				)
				.execute();

			console.log("Restored document from checkpoint");

			// Update our UI with the restored document immediately
			setCurrentDoc(docToRestore);

			// Update the polling atom to trigger reactive updates
			setPollingTimestamp(Date.now());

			// Save to OPFS
			await saveLixToOpfs({ lix });
			console.log("Saved restored state to OPFS");

			alert("Checkpoint restored successfully!");
		} catch (error) {
			console.error("Error restoring checkpoint:", error);
			alert("Error restoring checkpoint: " + (error as Error).message);
		}
	};

	// Add auto-save to OPFS
	useEffect(() => {
		if (!lix) return;

		// Save to OPFS every 5 seconds
		const intervalId = setInterval(async () => {
			try {
				await saveLixToOpfs({ lix });
				console.log("Auto-saved to OPFS");
			} catch (error) {
				console.error("Error during auto-save to OPFS:", error);
			}
		}, 5000);

		return () => clearInterval(intervalId);
	}, [lix]);

	return (
		<div
			className="app-container"
			style={{
				display: "flex",
				height: "100vh",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>
			{/* Admin Menu (hidden by default) */}
			{showAdminMenu && (
				<div
					style={{
						padding: "10px 20px",
						backgroundColor: "#f0f0f0",
						borderBottom: "1px solid #ccc",
					}}
				>
					<h3>Admin Menu</h3>
					<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
						<button
							onClick={handleSaveToOpfs}
							style={{
								backgroundColor: "#4CAF50",
								color: "white",
								border: "none",
								borderRadius: "4px",
								padding: "8px 16px",
								cursor: "pointer",
							}}
						>
							Save to OPFS
						</button>

						<button
							onClick={handleResetOpfs}
							style={{
								backgroundColor: "#f44336",
								color: "white",
								border: "none",
								borderRadius: "4px",
								padding: "8px 16px",
								cursor: "pointer",
							}}
						>
							Reset All Data
						</button>

						<span>
							OPFS Files: {opfsFiles.length > 0 ? opfsFiles.join(", ") : "None"}
						</span>
					</div>
				</div>
			)}

			<div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
				<div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<h1
							style={{ cursor: "pointer" }}
							onDoubleClick={toggleAdminMenu}
							title="Double-click to toggle admin menu"
						>
							ProseMirror Lix Plugin Demo
						</h1>
						<div style={{ display: "flex", gap: "10px" }}>
							<button
								onClick={handleSaveToOpfs}
								style={{
									backgroundColor: "#4CAF50",
									color: "white",
									border: "none",
									borderRadius: "4px",
									padding: "8px 16px",
									cursor: "pointer",
								}}
							>
								Save
							</button>
							<button
								onClick={() => setShowSidebar(!showSidebar)}
								style={{
									backgroundColor: "#4a90e2",
									color: "white",
									border: "none",
									borderRadius: "4px",
									padding: "8px 16px",
									cursor: "pointer",
								}}
							>
								{showSidebar ? "Hide Checkpoints" : "Show Checkpoints"}
							</button>
						</div>
					</div>
					<p>
						Edit the document below. Changes will be automatically saved to Lix.
						Your data is persisted in your browser's storage.
					</p>

					<div className="editor-outer-container" data-editor-instance="main">
						<Editor
							key="prosemirror-editor"
							onChange={handleDocChange}
							externalDoc={currentDoc}
						/>
					</div>

					<LixDebugPanel currentDoc={currentDoc} />

					<div className="changes-section" style={{ marginTop: "20px" }}>
						{/* Display changes from Lix */}
						<ChangesDisplay />
					</div>
				</div>

				{showSidebar && currentVersionId && (
					<CheckpointSidebar
						currentVersionId={currentVersionId}
						onRestoreCheckpoint={handleRestoreCheckpoint}
					/>
				)}
			</div>
		</div>
	);
}

export default App;