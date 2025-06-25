import { Plugin, PluginKey, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { executeSync, type Lix } from "@lix-js/sdk";

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
	const { lix, debounceTime = 400 } = options;

	lix.sqlite.createFunction(
		"handle_lix_prosemirror_update",
		(...values: any[]) => {
			const data = new TextDecoder().decode(values[1]);
			const json = JSON.parse(data);

			const isInternalUpdate = executeSync({
				lix,
				query: lix.db
					.selectFrom("key_value")
					.where("key", "=", "prosemirror_is_editor_update")
					.select("value"),
			})[0];

			// Only update the editor if this is an external change
			if (!isInternalUpdate) {
				updateEditorFromExternalDoc(json);
			}

			// clean up the update flag
			executeSync({
				lix,
				query: lix.db
					.deleteFrom("key_value")
					.where("key", "=", "prosemirror_is_editor_update"),
			});
			return null;
		},
		{
			name: "handle_lix_prosemirror_update",
			arity: -1,
		},
	);

	// lix.sqlite.exec(`
	//   CREATE TEMP TRIGGER IF NOT EXISTS lix_prosemirror_update
	//   AFTER UPDATE ON file
	//   WHEN NEW.id = '${options.fileId}'
	//   BEGIN
	//     SELECT handle_lix_prosemirror_update(NEW.data, json(NEW.metadata));
	//   END;
	//   `);

	// Track if there's a save in progress to prevent multiple simultaneous saves
	let saveInProgress = false;
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let view: EditorView | null = null;
	let lastExternalDoc: any = null;

	// Function to save the document to Lix
	const saveDocumentToLix = (docJSON: any) => {
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
			const fileData = new TextEncoder().encode(JSON.stringify(docJSON));

			// Upsert the prosemirror_is_editor_update flag
			const updateResult = await lix.db
				.updateTable("key_value")
				.set({
					value: "true",
					// skip_change_control: true,
				})
				.where("key", "=", "prosemirror_is_editor_update")
				.execute();

			// If no rows were updated, insert a new row
			if (updateResult.length === 0 || updateResult[0]?.numUpdatedRows === 0n) {
				await lix.db
					.insertInto("key_value")
					.values({
						key: "prosemirror_is_editor_update",
						value: "true",
						// skip_change_control: true,
					})
					.execute();
			}

			await lix.db
				.updateTable("file")
				.set({ data: fileData })
				.where("id", "=", options.fileId)
				.execute()
				.then(() => {
					saveInProgress = false;
				})
				.catch((error) => {
					console.error("Error saving document to Lix:", error);
					saveInProgress = false;
				});
		}, debounceTime);
	};

	// Function to update the editor with external document changes
	const updateEditorFromExternalDoc = (externalDoc: any) => {
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
			// Create a transaction to replace the document
			const tr = view.state.tr;

			// Create a new document from JSON
			const newDoc = options.schema.nodeFromJSON(externalDoc);

			// Replace the current document
			tr.replaceWith(0, view.state.doc.content.size, newDoc.content);

			// Apply the transaction
			view.dispatch(tr);
		} catch (error) {
			console.error("Error updating document from external source:", error);
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

			if (docChanged) {
				// Save the document to Lix
				saveDocumentToLix(newState.doc.toJSON());
			}

			return null;
		},

		// Set up the view
		view(editorView) {
			// Store the view reference
			view = editorView;

			return {
				update(view, prevState) {
					// Check if we have a new external doc to apply
					const pluginState = lixPluginKey.getState(view.state);
					if (
						pluginState.externalDoc &&
						pluginState.externalDoc !==
							lixPluginKey.getState(prevState).externalDoc
					) {
						updateEditorFromExternalDoc(pluginState.externalDoc);
					}
				},
				destroy() {
					// Cancel any pending save operations
					if (saveTimeout) {
						clearTimeout(saveTimeout);
					}

					// Clear the view reference
					view = null;
				},
			};
		},
	});
}
