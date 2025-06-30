import {
	Plugin,
	PluginKey,
	Transaction,
	TextSelection,
} from "prosemirror-state";
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
	const updateEditorFromExternalDoc = async (
		externalDoc: any,
		isInitialLoad = false,
	) => {
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

	const plugin = new Plugin({
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
				const docJSON = newState.doc.toJSON();

				// Save document directly to file (only if not applying external update)
				saveDocumentToLix(docJSON);
			}

			return null;
		},

		// Set up the view
		view(editorView) {
			// Store the view reference
			view = editorView;

			// Subscribe to file data changes using the new observe API
			const fileSubscription = lix
				.observe(
					lix.db
						.selectFrom("file")
						.where("id", "=", fileId)
						.select(["id", "data"]),
				)
				.subscribeTakeFirst({
					next: async (file) => {
						if (!file || !file.data) return;

						// Skip if this is our own save in progress
						if (saveInProgress) return;

						try {
							const fileContent = new TextDecoder().decode(file.data);
							const fullDoc = JSON.parse(fileContent);

							// Check if this is initial load
							const isInitialLoad = lastExternalDoc === null;

							// Update editor with new document
							await updateEditorFromExternalDoc(fullDoc, isInitialLoad);
						} catch (error) {
							console.error("Error processing file data update:", error);
						}
					},
					error: (error) => {
						console.error("Error subscribing to file data:", error);
					},
				});

			return {
				destroy() {
					// Cancel any pending save operations
					if (saveTimeout) {
						clearTimeout(saveTimeout);
					}
					// Unsubscribe from file data changes
					fileSubscription.unsubscribe();
					// Clear the view reference
					view = null;
				},
			};
		},
	});

	return plugin;
}
