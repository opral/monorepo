import { EMPTY_DOCUMENT_PROMPT_KEY } from "@/components/editor/plugins/empty-document-prompt-plugin";
import { TElement } from "@udecode/plate";
import { PlateEditor } from "@udecode/plate/react";
import { Lix } from "@lix-js/sdk";

export const insertEmptyPromptElement = (editor: PlateEditor) => {
	if (!editor) return;

	// Remove any existing empty prompt elements first
	const filteredNodes = [...editor.children].filter(
		(node: TElement) => node.type !== EMPTY_DOCUMENT_PROMPT_KEY
	);

	const emptyPromptElement = {
		type: EMPTY_DOCUMENT_PROMPT_KEY,
		children: [{ text: "" }],
	};

	// Find the first heading level 1
	const headingIndex = filteredNodes.findIndex(
		(node: TElement) => node.type === "h1"
	);

	// If a heading level 1 exists, insert after it
	if (headingIndex !== -1) {
		filteredNodes.splice(headingIndex + 1, 0, emptyPromptElement);
	} else {
		// Otherwise insert at the beginning of the document
		filteredNodes.unshift(emptyPromptElement);
	}

	editor.tf.setValue(filteredNodes);
};

export const hasEmptyPromptElement = (editor: PlateEditor) => {
	if (!editor) return false;

	return editor.children.some(
		(node: any) => node.type === EMPTY_DOCUMENT_PROMPT_KEY
	);
};

export const removeEmptyPromptElement = (editor: PlateEditor) => {
	if (!editor) return;

	if (hasEmptyPromptElement(editor)) {
		editor.tf.setValue(
			editor.children.filter(
				(node: any) => node.type !== EMPTY_DOCUMENT_PROMPT_KEY
			)
		);
	}
};

export const setPromptDismissed = async (lix: Lix, activeFileId: string) => {
	// Store in database that this file has had the prompt dismissed
	try {
		await lix.db.transaction().execute(async (trx) => {
			const existing = await trx
				.selectFrom("key_value")
				.where("key", "=", `flashtype_prompt_dismissed_${activeFileId}`)
				.select("value")
				.executeTakeFirst();

			if (!existing) {
				await trx
					.insertInto("key_value")
					.values({
						key: `flashtype_prompt_dismissed_${activeFileId}`,
						value: true,
					})
					.execute();
			} else {
				await trx
					.updateTable("key_value")
					.where("key", "=", `flashtype_prompt_dismissed_${activeFileId}`)
					.set({ value: true })
					.execute();
			}
		});
	} catch (error) {
		console.error("Error saving prompt dismissed state:", error);
	}
};

export const getPromptDismissed = async (lix: Lix, activeFileId: string) => {
	// Check if the prompt has been dismissed for this file
	const promptDismissed = await lix.db
		.selectFrom("key_value")
		.where("key", "=", `flashtype_prompt_dismissed_${activeFileId}`)
		.select("value")
		.executeTakeFirst();

	return promptDismissed?.value === true || promptDismissed?.value === "true" || promptDismissed?.value === 1;
};
