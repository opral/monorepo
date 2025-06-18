import type { LixPlugin } from "@lix-js/sdk";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = ({
	file,
	changes,
}) => {
	// Start with existing file data or empty string
	let currentText = "";
	if (file.data && file.data.length > 0) {
		currentText = new TextDecoder().decode(file.data);
	}

	// Apply changes - for text plugin, we simply use the latest change
	// since the text plugin treats the entire file as one entity
	for (const change of changes) {
		if (change.snapshot_content === null) {
			// Handle deletion by clearing the text
			currentText = "";
		} else {
			// Update with new text content
			const content = change.snapshot_content as { text: string };
			currentText = content.text;
		}
	}

	return {
		fileData: new TextEncoder().encode(currentText),
	};
};