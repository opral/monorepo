import { useState, useEffect } from "react";
import { openLixInMemory } from "@lix-js/sdk";
import { detectChanges, applyChanges } from "@lix-js/plugin-prosemirror";
import Editor from "./components/Editor";
import ChangesDisplay from "./components/ChangesDisplay";

function App() {
	const [currentDoc, setCurrentDoc] = useState<any>({
		type: "doc",
		content: [],
	});
	const [previousDoc, setPreviousDoc] = useState<any>({
		type: "doc",
		content: [],
	});
	const [changes, setChanges] = useState<any[]>([]);
	const [lix, setLix] = useState<any>(null);

	// Initialize Lix on component mount and set initial documents
	useEffect(() => {
		async function initLix() {
			try {
				const lixInstance = await openLixInMemory({});
				setLix(lixInstance);
				console.log("Lix initialized successfully");

				// Set initial document structure for both current and previous
				const initialDoc = {
					type: "doc",
					attrs: { _id: `doc-${Date.now()}` },
					content: [],
				};

				setCurrentDoc(initialDoc);
				setPreviousDoc(initialDoc);
			} catch (error) {
				console.error("Failed to initialize Lix:", error);
			}
		}

		initLix();
	}, []);

	// Handle doc changes from the editor
	const handleDocChange = (newDoc: any) => {
		// Always update current document state
		console.log("Document changed from editor");

		// Ensure all nodes have the proper structure with attrs
		// This is needed for proper change detection
		const ensureNodeStructure = (node: any) => {
			if (!node) return node;

			// Make sure the node has attrs with _id if not text
			if (node.type !== "text") {
				node.attrs = node.attrs || {};
				if (!node.attrs._id) {
					node.attrs._id = `${node.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
				}
			}

			// Recursively process content
			if (node.content && Array.isArray(node.content)) {
				node.content = node.content.map(ensureNodeStructure);
			}

			return node;
		};

		// Create a deep copy and ensure proper structure
		const processedDoc = ensureNodeStructure(
			JSON.parse(JSON.stringify(newDoc)),
		);

		// Update current document with the processed version
		setCurrentDoc(processedDoc);
	};

	// Function to manually detect changes between current and previous doc
	const detectDocChanges = async () => {
		// Skip change detection if Lix is not initialized
		if (!lix) {
			console.log("Skipping change detection - Lix not initialized");
			alert("Lix not initialized yet. Please try again in a moment.");
			return;
		}

		try {
			console.log("Detecting changes...");
			console.log("Previous doc:", previousDoc);
			console.log("Current doc:", currentDoc);

			// Ensure both documents have the required structure
			// The detection algorithm expects attrs._id fields on nodes
			if (!previousDoc.attrs || !previousDoc.attrs._id) {
				console.warn("Previous document missing required _id attribute");
			}

			if (!currentDoc.attrs || !currentDoc.attrs._id) {
				console.warn("Current document missing required _id attribute");
			}

			// Step 1: Do a manual detection first to debug
			const manuallyDetectedChanges: any[] = [];

			// Look for changes in the document structure
			if (JSON.stringify(previousDoc) !== JSON.stringify(currentDoc)) {
				console.log("Documents differ - manually checking for changes");

				// Check all nodes in current doc that are not in previous doc
				const findNodesWithId = (node, map = new Map()) => {
					if (node.attrs && node.attrs._id) {
						map.set(node.attrs._id, node);
					}
					if (node.content && Array.isArray(node.content)) {
						for (const child of node.content) {
							findNodesWithId(child, map);
						}
					}
					return map;
				};

				const previousNodes = findNodesWithId(previousDoc);
				const currentNodes = findNodesWithId(currentDoc);

				// Check for added/modified nodes
				for (const [id, node] of currentNodes.entries()) {
					if (!previousNodes.has(id)) {
						console.log("New node found:", id, node);
						manuallyDetectedChanges.push({
							entity_id: id,
							schema: { key: "prosemirror_node_v1", type: "json" },
							snapshot: node,
						});
					} else {
						// Compare the nodes
						if (
							JSON.stringify(previousNodes.get(id)) !== JSON.stringify(node)
						) {
							console.log("Modified node found:", id, node);
							manuallyDetectedChanges.push({
								entity_id: id,
								schema: { key: "prosemirror_node_v1", type: "json" },
								snapshot: node,
							});
						}
					}
				}

				// Check for deleted nodes
				for (const [id, node] of previousNodes.entries()) {
					if (!currentNodes.has(id)) {
						console.log("Deleted node found:", id, node);
						manuallyDetectedChanges.push({
							entity_id: id,
							schema: { key: "prosemirror_node_v1", type: "json" },
							// No snapshot for deleted nodes
						});
					}
				}
			}

			console.log("Manually detected changes:", manuallyDetectedChanges);

			// If we manually found changes, use them directly
			if (manuallyDetectedChanges.length > 0) {
				setChanges(manuallyDetectedChanges);
				console.log(
					"Changes detected and added to the list:",
					manuallyDetectedChanges.length,
				);
				return;
			}

			// If manual detection didn't find any changes, try with the library function
			const beforeData = new TextEncoder().encode(JSON.stringify(previousDoc));
			const afterData = new TextEncoder().encode(JSON.stringify(currentDoc));

			const before = {
				id: "prosemirror-doc",
				path: "/prosemirror.json",
				data: beforeData,
				metadata: null,
			};

			const after = {
				id: "prosemirror-doc",
				path: "/prosemirror.json",
				data: afterData,
				metadata: null,
			};

			console.log("Calling plugin detectChanges function...");
			const detectedChanges = await detectChanges({ lix, before, after });
			console.log("Plugin detected changes:", detectedChanges);

			if (detectedChanges && detectedChanges.length > 0) {
				setChanges(Array.isArray(detectedChanges) ? detectedChanges : []);
				console.log(
					"Changes detected and added to the list:",
					detectedChanges.length,
				);
			} else {
				console.log("No changes detected");
				alert("No changes detected between documents");
			}
		} catch (error) {
			console.error("Error detecting changes:", error);
			alert(`Error detecting changes: ${(error as Error).message}`);
		}
	};

	// Apply detected changes to document
	const applyDetectedChanges = async () => {
		if (!lix || changes.length === 0) {
			alert("No changes to apply or Lix not initialized.");
			return;
		}

		try {
			console.log("Applying changes to document");
			console.log("Changes to apply:", changes);

			// Create a file object for the target document that matches what the plugin expects
			const file = {
				id: "prosemirror-doc",
				path: "/prosemirror.json",
				data: new TextEncoder().encode(JSON.stringify(previousDoc)),
				metadata: null,
			};

			// Call the applyChanges function
			const result = await applyChanges({
				lix, // The Lix instance is needed to access the database
				file, // The base file to apply changes to
				changes, // The array of changes to apply
			});

			console.log("Result after applying changes:", result);

			if (result && result.fileData) {
				try {
					// Parse the result data
					const resultText = new TextDecoder().decode(result.fileData);
					const resultData = JSON.parse(resultText);

					// Update the current document with the result
					setCurrentDoc(resultData);
					console.log("Document updated with applied changes:", resultData);
					alert("Changes successfully applied to document");
				} catch (parseError) {
					console.error("Error parsing result:", parseError);
					alert("Error parsing the result after applying changes");
				}
			} else {
				console.error("No result from applyChanges");
				alert("Failed to apply changes - no result returned");
			}
		} catch (error) {
			console.error("Error applying changes:", error);
			alert(`Error applying changes: ${(error as Error).message}`);
		}
	};

	// Handle rollback to a specific change
	const handleRollbackChange = (change: any) => {
		console.log("Rolling back to change:", change);

		if (!change || !change.entity_id) {
			alert("Cannot rollback: Invalid change selected");
			return;
		}

		try {
			// For added/modified entities: if we have a snapshot, we want to
			// apply that snapshot in the current document
			if (change.snapshot) {
				console.log(
					"Current document structure:",
					JSON.stringify(currentDoc, null, 2),
				);
				console.log("Change entity ID:", change.entity_id);
				console.log("Snapshot to apply:", change.snapshot);

				// Create a deep copy of the current document
				const updatedDoc = JSON.parse(JSON.stringify(currentDoc));

				// Special case: If the entity ID is the document ID, replace the entire document
				if (updatedDoc.attrs && updatedDoc.attrs._id === change.entity_id) {
					console.log("Updating entire document");

					// Keep the document ID but update content
					const newDoc = {
						...change.snapshot,
						attrs: { ...change.snapshot.attrs, _id: updatedDoc.attrs._id },
					};

					console.log("Setting new document:", newDoc);
					setCurrentDoc(newDoc);
					alert(`Successfully rolled back the entire document`);
					return;
				}

				// For paragraph-level changes
				if (
					change.entity_id.startsWith("paragraph-") ||
					change.entity_id.startsWith("p-")
				) {
					console.log("This appears to be a paragraph-level change");

					// First try: Direct search for the node
					let found = false;

					// Check each paragraph in the document
					if (updatedDoc.content && Array.isArray(updatedDoc.content)) {
						for (let i = 0; i < updatedDoc.content.length; i++) {
							const node = updatedDoc.content[i];
							if (node.attrs && node.attrs._id === change.entity_id) {
								console.log("Found the paragraph to update at index", i);
								updatedDoc.content[i] = change.snapshot;
								found = true;
								break;
							}
						}
					}

					// If not found directly, try to find it anywhere in the document
					if (!found) {
						console.log(
							"Paragraph not found at top level, searching deeper...",
						);

						// This recursive function tries to find and update a node by ID
						const updateNodeById = (
							node: any,
							id: string,
							snapshot: any,
						): boolean => {
							// Direct match for this node
							if (node.attrs && node.attrs._id === id) {
								return snapshot; // Return the snapshot to replace this node
							}

							// Check children if this has content
							if (node.content && Array.isArray(node.content)) {
								for (let i = 0; i < node.content.length; i++) {
									const result = updateNodeById(node.content[i], id, snapshot);

									// If result is an object (the replacement node)
									if (
										result &&
										typeof result === "object" &&
										result !== true &&
										result !== false
									) {
										node.content[i] = result;
										return true; // Indicate update was successful
									}
								}
							}

							return false; // Not found in this branch
						};

						// Try to update the node
						const result = updateNodeById(
							updatedDoc,
							change.entity_id,
							change.snapshot,
						);

						if (result === true || (result && typeof result === "object")) {
							found = true;
							console.log("Found and updated the node deeper in the document");
						}
					}

					// If node was found and updated
					if (found) {
						// Create a completely new object to ensure React detects the change
						const newDoc = JSON.parse(JSON.stringify(updatedDoc));
						console.log("Rolling back to updated document:", newDoc);
						setCurrentDoc(newDoc);
						alert(
							`Successfully rolled back change to paragraph ${change.entity_id}`,
						);
						return;
					}
				}

				// If we get here, we need a more general approach to find the node
				// This is a simplified version that just adds the node if it can't be found
				console.log("Using fallback approach to update the document");

				// If the node is a block-level element, we can try to add it to the document
				if (
					change.snapshot.type === "paragraph" ||
					change.snapshot.type === "heading" ||
					change.snapshot.type === "blockquote" ||
					change.snapshot.type === "code_block"
				) {
					if (!updatedDoc.content) {
						updatedDoc.content = [];
					}

					// Add the node to the document
					updatedDoc.content.push(change.snapshot);

					const newDoc = JSON.parse(JSON.stringify(updatedDoc));
					console.log("Added node to document:", newDoc);
					setCurrentDoc(newDoc);
					alert(`Added the node to the document`);
				} else {
					console.warn("Could not find node to update:", change.entity_id);
					alert("Could not find the target node in the document");
				}
			}
			// For deletions (no snapshot), we need to restore from the previousDoc
			else {
				console.log(
					"Handling a deletion - trying to restore node:",
					change.entity_id,
				);
				console.log("Previous document:", previousDoc);
				console.log("Current document:", currentDoc);

				// Enhanced function to find a node by ID
				const findNodeById = (doc: any, id: string): any => {
					if (!doc) return null;

					// Check if this is the node we're looking for
					if (doc.attrs && doc.attrs._id === id) {
						return doc;
					}

					// Recursively search children
					if (doc.content && Array.isArray(doc.content)) {
						for (const child of doc.content) {
							const found = findNodeById(child, id);
							if (found) return found;
						}
					}

					return null;
				};

				// Try to find the deleted node in the previous document
				const deletedNode = findNodeById(previousDoc, change.entity_id);

				if (deletedNode) {
					console.log("Found deleted node to restore:", deletedNode);

					// Create a deep copy of the current document
					const updatedDoc = JSON.parse(JSON.stringify(currentDoc));

					// If it's not the doc itself, we need to find an appropriate place to insert it
					if (deletedNode.type !== "doc") {
						// For all block-level nodes, we can add them to the document content
						if (
							deletedNode.type === "paragraph" ||
							deletedNode.type === "heading" ||
							deletedNode.type === "blockquote" ||
							deletedNode.type === "code_block" ||
							deletedNode.type === "bullet_list" ||
							deletedNode.type === "ordered_list"
						) {
							// Make sure we have content array
							if (!updatedDoc.content) {
								updatedDoc.content = [];
							}

							// Create a copy of the deleted node
							const nodeToRestore = JSON.parse(JSON.stringify(deletedNode));

							// Add the node to the end of the document
							updatedDoc.content.push(nodeToRestore);

							// Create a completely new object to ensure React detects the change
							const newDoc = JSON.parse(JSON.stringify(updatedDoc));
							console.log("Restoring deleted node to document:", newDoc);
							setCurrentDoc(newDoc);
							alert(`Successfully restored deleted node ${change.entity_id}`);
						} else {
							// For inline or other nodes, need more context to restore them
							console.warn(
								"Cannot restore this type of deleted node automatically:",
								deletedNode.type,
							);
							alert(
								`Cannot automatically restore this type of node: ${deletedNode.type}`,
							);
						}
					} else {
						// Replacing the whole document is dangerous
						console.warn("Cannot restore the root document node");
						alert(
							"Cannot restore the document node itself - would replace entire document",
						);
					}
				} else {
					console.warn("Could not find deleted node:", change.entity_id);
					alert("Could not find the deleted node in the previous document");
				}
			}
		} catch (error) {
			console.error("Error rolling back change:", error);
			alert(`Error rolling back change: ${(error as Error).message}`);
		}
	};

	// Clear all detected changes
	const clearChanges = () => {
		setChanges([]);
	};

	return (
		<div className="app-container">
			<h1>ProseMirror Lix Plugin Demo</h1>
			<p>Edit the document below. Changes will be detected and displayed.</p>

			<Editor onChange={handleDocChange} externalDoc={currentDoc} />

			<div className="action-buttons" style={{ marginTop: "15px" }}>
				<button
					onClick={() => {
						// Create a deep copy of the current document
						const snapshot = JSON.parse(JSON.stringify(currentDoc));
						// Store the original document structure and content
						console.log("Taking snapshot:", snapshot);
						setPreviousDoc(snapshot);
						alert(
							"Snapshot saved! Now make some changes and click 'Detect Changes'",
						);
					}}
					style={{ marginRight: "10px", backgroundColor: "#4caf50" }}
				>
					Take Snapshot
				</button>

				<button
					onClick={detectDocChanges}
					style={{ marginRight: "10px", backgroundColor: "#2196f3" }}
				>
					Detect Changes
				</button>

				<button
					onClick={applyDetectedChanges}
					style={{ marginRight: "10px", backgroundColor: "#ff9800" }}
					disabled={changes.length === 0}
				>
					Apply Changes
				</button>

				<button
					onClick={() => {
						// Simple direct restore to previous document state
						try {
							if (!previousDoc || !Object.keys(previousDoc).length) {
								alert("No snapshot available to restore!");
								return;
							}

							console.log("Restoring to previous snapshot:", previousDoc);

							// Create a completely new object to ensure React detects the change
							const restoredDoc = JSON.parse(JSON.stringify(previousDoc));

							// Update the current document with the snapshot
							setCurrentDoc(restoredDoc);

							alert("Successfully restored to previous snapshot");
						} catch (error) {
							console.error("Error restoring snapshot:", error);
							alert(`Error restoring snapshot: ${(error as Error).message}`);
						}
					}}
					style={{ marginRight: "10px", backgroundColor: "#673ab7" }}
				>
					Restore Snapshot
				</button>

				<button onClick={clearChanges} style={{ backgroundColor: "#f44336" }}>
					Clear Changes
				</button>
			</div>

			<div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
				<strong>How to use:</strong>
				<ol style={{ margin: "5px 0 0 20px", padding: 0 }}>
					<li>Click "Take Snapshot" to save the current document state</li>
					<li>Make some changes in the editor</li>
					<li>Click "Detect Changes" to find differences</li>
					<li>
						If you want to go back to your snapshot entirely, click "Restore
						Snapshot"
					</li>
					<li>
						If you want to work with individual changes, use the "Rollback"
						buttons on specific changes
					</li>
				</ol>
			</div>

			<div className="debug-section" style={{ marginTop: "20px" }}>
				<h3>Current Document Structure:</h3>
				<pre
					style={{
						backgroundColor: "#f5f5f5",
						padding: "10px",
						borderRadius: "4px",
						maxHeight: "200px",
						overflow: "auto",
						color: "#333",
					}}
				>
					{JSON.stringify(currentDoc, null, 2)}
				</pre>
			</div>

			<div className="changes-section" style={{ marginTop: "20px" }}>
				<div
					className="changes-header"
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<h3>Detected Changes ({changes.length})</h3>
					{changes.length > 0 && (
						<small style={{ color: "#666" }}>
							{changes.length} {changes.length === 1 ? "change" : "changes"}{" "}
							detected
						</small>
					)}
				</div>
				<ChangesDisplay
					changes={changes}
					previousDoc={previousDoc}
					onRollbackChange={handleRollbackChange}
				/>
			</div>
		</div>
	);
}

export default App;
