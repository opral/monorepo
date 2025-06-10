import { EMPTY_DOCUMENT_PROMPT_KEY } from "@/components/editor/plugins/empty-document-prompt-plugin";
import { TElement } from "@udecode/plate";
import { PlateEditor } from "@udecode/plate-core/react";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs";

export const insertEmptyPromptElement = (editor: PlateEditor) => {
	if (!editor) return;

	// Remove any existing empty prompt elements first
	const filteredNodes = [...editor.children].filter(
		(node: TElement) => node.type !== EMPTY_DOCUMENT_PROMPT_KEY
	);

	const emptyPromptElement: TElement = {
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

export const setPromptDismissed = (lix: any, activeFileId: string) => {
	// Store in database that this file has had the prompt dismissed
	(async () => {
		try {
			await lix.db
				.insertInto("key_value")
				.values({
					key: `flashtype_prompt_dismissed_${activeFileId}`,
					value: "true",
				})
				.onConflict((oc: any) => oc.doUpdateSet({ value: "true" }))
				.execute();
			await saveLixToOpfs({ lix });
		} catch (error) {
			console.error("Error saving prompt dismissed state:", error);
		}
	})();
};

export const getPromptDismissed = async (lix: any, activeFileId: string) => {
	// Check if the prompt has been dismissed for this file
	const promptDismissed = await lix.db
		.selectFrom("key_value")
		.where("key", "=", `flashtype_prompt_dismissed_${activeFileId}`)
		.select("value")
		.executeTakeFirst();

	return promptDismissed?.value === "true";
};