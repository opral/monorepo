import { Plugin, PluginKey, Transaction, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { type Lix } from "@lix-js/sdk";

// Create a plugin key for the Lix plugin
export const lixPluginKey = new PluginKey("lix-plugin");

interface LixPluginOptions {
	lix: Lix;
	fileId: string;
	schema: Schema;
	debounceTime?: number;
}

/**
 * Creates a ProseMirror plugin that automatically saves document changes to Lix
 */
export function lixProsemirror(options: LixPluginOptions) {
	const { lix, fileId, schema, debounceTime = 400 } = options;

	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let saveInProgress = false;
	let view: EditorView | null = null;
	let lastExternalDoc: any = null;
	let isApplyingExternalUpdate = false;

	// Function to save document directly to file with debouncing
	const saveDocumentToLix = (docJSON: any) => {
		// Don't save if we're currently applying an external update
		if (isApplyingExternalUpdate) return;

		// Clear any pending timeout
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		// Set a new timeout for debouncing
		saveTimeout = setTimeout(async () => {
			// If a save is already in progress, don't start another one
			if (saveInProgress) return;

			saveInProgress = true;
			try {
				const fileData = new TextEncoder().encode(JSON.stringify(docJSON));

				await lix.db
					.updateTable("file")
					.set({ data: fileData })
					.where("id", "=", fileId)
					.execute();
			} catch (error) {
				console.error("Error saving document to Lix:", error);
			} finally {
				saveInProgress = false;
			}
		}, debounceTime);
	};

	// Function to update the editor with external document changes
	const updateEditorFromExternalDoc = async (externalDoc: any, isInitialLoad = false) => {
		// Skip if the view is not initialized yet
		if (!view) return;

		// Skip if the document is the same as the last one we processed
		if (
			lastExternalDoc &&
			JSON.stringify(lastExternalDoc) === JSON.stringify(externalDoc)
		) {
			return;
		}

		// Update the last external doc reference
		lastExternalDoc = externalDoc;

		try {
			// Set flag to prevent saving while applying external update
			isApplyingExternalUpdate = true;

			// Create a new document from JSON
			const newDoc = schema.nodeFromJSON(externalDoc);

			// Create a transaction to replace the document
			const tr = view.state.tr;

			// Replace the current document
			tr.replaceWith(0, view.state.doc.content.size, newDoc.content);

			// For initial load, set selection to the beginning to avoid highlighting all text
			if (isInitialLoad) {
				tr.setSelection(TextSelection.atStart(tr.doc));
			}

			// Apply the transaction
			view.dispatch(tr);
		} catch (error) {
			console.error("Error updating document from external source:", error);
		} finally {
			// Reset flag after a short delay to allow the transaction to complete
			setTimeout(() => {
				isApplyingExternalUpdate = false;
			}, 100);
		}
	};

	return new Plugin({
		key: lixPluginKey,

		// Initialize the plugin state
		state: {
			init() {
				return {
					lastSaved: null,
					externalDoc: null,
				};
			},
			apply(tr: Transaction, value) {
				// Check if we have an external doc update in the transaction metadata
				const externalDoc = tr.getMeta(lixPluginKey)?.externalDoc;

				if (externalDoc) {
					return {
						...value,
						externalDoc,
					};
				}

				return value;
			},
		},

		// Handle document changes
		appendTransaction(transactions, _oldState, newState) {
			// Check if any transaction changed the document
			const docChanged = transactions.some((tr) => tr.docChanged);

			if (docChanged && !isApplyingExternalUpdate) {
				// Save document directly to file (only if not applying external update)
				saveDocumentToLix(newState.doc.toJSON());
			}

			return null;
		},

		// Set up the view
		view(editorView) {
			// Store the view reference
			view = editorView;

			// Load initial document from Lix
			const loadInitialDocument = async () => {
				try {
					const file = await lix.db
						.selectFrom("file")
						.where("id", "=", fileId)
						.select("data")
						.executeTakeFirst();

					if (file && file.data) {
						const fileContent = new TextDecoder().decode(file.data);
						const initialDoc = JSON.parse(fileContent);
						
						// Only load if the current document is empty (initial state)
						const currentDoc = editorView.state.doc;
						const isEmpty = currentDoc.content.size === 0 || 
							(currentDoc.content.size === 2 && currentDoc.textContent === "");

						if (isEmpty) {
							await updateEditorFromExternalDoc(initialDoc, true);
						}
					}
				} catch (error) {
					console.error("Error loading initial document:", error);
				}
			};

			// Load initial document
			loadInitialDocument();

			// Set up file change listener
			const unsubscribe = lix.hooks.onFileChange(async (changedFileId, operation) => {
				if (changedFileId === fileId && operation === 'updated') {
					try {
						// Fetch the updated file content
						const updatedFile = await lix.db
							.selectFrom("file")
							.where("id", "=", fileId)
							.select("data")
							.executeTakeFirst();

						if (updatedFile && updatedFile.data) {
							const fileContent = new TextDecoder().decode(updatedFile.data);
							const externalDoc = JSON.parse(fileContent);
							
							// Update the editor with the external document
							await updateEditorFromExternalDoc(externalDoc);
						}
					} catch (error) {
						console.error("Error handling external file update:", error);
					}
				}
			});

			return {
				update() {
					// File change handling is now done via the hook
				},
				destroy() {
					// Cancel any pending save operations
					if (saveTimeout) {
						clearTimeout(saveTimeout);
					}
					// Remove file change listener
					unsubscribe();
					// Clear the view reference
					view = null;
				},
			};
		},
	});
}
