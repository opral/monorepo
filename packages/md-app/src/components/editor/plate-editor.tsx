// import { DOMEditor } from 'slate-dom';
import { useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Plate } from "@udecode/plate/react";

import { useCreateEditor } from "@/components/editor/use-create-editor";
// import { SettingsDialog } from "@/components/editor/settings";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { debounce } from "lodash-es";
import { useAtom } from "jotai";
import { editorRefAtom, lixAtom } from "@/state";
import { activeFileAtom, loadedMdAtom } from "@/state-active-file";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs";
import { ExtendedMarkdownPlugin } from "./plugins/markdown/markdown-plugin";
import { TElement } from "@udecode/plate";
import { EMPTY_DOCUMENT_PROMPT_KEY } from "./plugins/empty-document-prompt-plugin";
import { welcomeMd } from "@/helper/welcomeLixFile";

export function PlateEditor() {
	const [lix] = useAtom(lixAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [loadedMd] = useAtom(loadedMdAtom);
	const [, setEditorRef] = useAtom(editorRefAtom);

	const editor = useCreateEditor();

	const insertEmptyPromptElement = () => {
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


	// Store the editor reference in the global atom
	useEffect(() => {
		setEditorRef(editor);
	}, [editor, setEditorRef]);

	useEffect(() => {
		if (editor && loadedMd !== editor.getApi(ExtendedMarkdownPlugin).markdown.serialize()) {
			const nodes = editor
				.getApi(ExtendedMarkdownPlugin)
				.markdown.deserialize(loadedMd);
			editor.tf.setValue(nodes);
		}
	}, [activeFile?.id]);

	useEffect(() => {
		if (!editor) return;

		// Check if document is empty or just whitespace
		const isEmpty = !loadedMd || loadedMd.trim() === '';

		// Check if this is the welcome document or closely resembles it
		// We use includes() to allow for small edits while maintaining the prompt
		const isWelcomeOrSimilar = loadedMd && (
			loadedMd === welcomeMd ||
			loadedMd.includes("Flashtype.ai ⚡️") ||
			loadedMd.includes("🤖 Autocomplete your document")
		);

		if (isEmpty || isWelcomeOrSimilar) {
			insertEmptyPromptElement();
		} else {
			// Remove empty document prompt element if document is not empty
			// First check if there are any empty document prompt elements
			const hasEmptyPrompt = editor.children.some(
				(node) => node.type === EMPTY_DOCUMENT_PROMPT_KEY
			);

			if (hasEmptyPrompt) {
				// If we have prompt elements but document is not empty,
				// deserialize the markdown and replace the editor content
				const nodes = editor
					.getApi(ExtendedMarkdownPlugin)
					.markdown.deserialize(loadedMd);
				editor.tf.setValue(nodes);
			}
		}
	}, [editor, loadedMd]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
				// if (!editor.api.isFocused()) {
				// 	editor.getApi(BlockSelectionPlugin).blockSelection.selectAll();
				// } else {

				// Only attempt to select all if we have editor content
				if (!editor || !editor.children || editor.children.length === 0) {
					return;
				}

				// recursive function to get the length of the last text node
				function getLastTextOffset(node: TElement): number {
					if (!node.children || node.children.length === 0) {
						// @ts-expect-error - length is not defined on TElement
						return node.text ? node.text.length : 0;
					}
					const lastChild = node.children[node.children.length - 1];
					if ('children' in lastChild) {
						return getLastTextOffset(lastChild as TElement);
					}
					return lastChild.text ? lastChild.text.length : 0;
				}

				try {
					editor.tf.select(
						{
							anchor: { path: [0, 0], offset: 0 },
							focus: {
								path: [
									editor.children.length - 1,
									editor.children[editor.children.length - 1].children.length - 1,
								],
								offset:
									getLastTextOffset(editor.children[editor.children.length - 1]),
							},
						},
						{ focus: true }
					);
					event.preventDefault();
				} catch (err) {
					console.error("Error selecting all text:", err);
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [editor, loadedMd]); // Include loadedMd to re-attach event listener when content changes

	// useCallback because react shouldn't recreate the function on every render
	// debounce because keystroke changes are not important for the lix 1.0 preview
	// given that we do not have real-time collabroation and no feature yet to
	// delete changes/disregard keystroke changes on merge
	const handleUpdateMdData = useCallback(
		debounce(async (newData) => {
			// Only save if we have an active file
			if (!activeFile) return;

			const serializedMd = newData.editor.getApi(ExtendedMarkdownPlugin).markdown.serialize();

			await lix.db
				.updateTable("file")
				.set("data", new TextEncoder().encode(serializedMd))
				.where("id", "=", activeFile.id)
				.returningAll()
				.execute();

			// needed because lix is not writing to OPFS yet
			await saveLixToOpfs({ lix });
			console.log("saved to lix db");
		}, 500),
		[lix, activeFile?.id] // Include activeFile.id in dependencies
	);

	// Memoize the value change handler to avoid unnecessary re-renders
	const handleValueChange = useCallback((newValue: any) => {
		if (!activeFile) return; // Don't save if no active file

		const newContent = newValue.editor.getApi(ExtendedMarkdownPlugin).markdown.serialize();

		if (loadedMd !== newContent) {
			handleUpdateMdData(newValue);
		}

	}, [loadedMd, handleUpdateMdData, activeFile]);

	return (
		<DndProvider backend={HTML5Backend}>
			<Plate
				editor={editor}
				onValueChange={handleValueChange}
			>
				<EditorContainer>
					<Editor />
				</EditorContainer>
				{/* <SettingsDialog /> */}
			</Plate>
		</DndProvider>
	);
}
