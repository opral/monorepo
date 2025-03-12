import { useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Plate } from "@udecode/plate/react";

import { useCreateEditor } from "@/components/editor/use-create-editor";
// import { SettingsDialog } from "@/components/editor/settings";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { debounce } from "lodash-es";
import { useAtom } from "jotai";
import { lixAtom } from "@/state";
import { activeFileAtom, loadedMdAtom } from "@/state-active-file";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs";
import { ExtendedMarkdownPlugin } from "./plugins/markdown/markdown-plugin";
import { BlockSelectionPlugin } from "@udecode/plate-selection/react";

export function PlateEditor() {
	const [lix] = useAtom(lixAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [loadedMd] = useAtom(loadedMdAtom);

	const editor = useCreateEditor();

	// Set the initial value of the editor
	useEffect(() => {
		if (
			loadedMd !== editor.getApi(ExtendedMarkdownPlugin).markdown.serialize()
		) {
			const nodes = editor
				.getApi(ExtendedMarkdownPlugin)
				.markdown.deserialize(loadedMd);
			editor.tf.setValue(nodes);
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
				if (editor.getApi(BlockSelectionPlugin).blockSelection.getNodes().length > 0) {
					editor.getApi(BlockSelectionPlugin).blockSelection.selectAll();
				} else {
					editor.tf.select(
						{
							anchor: { path: [0, 0], offset: 0 },
							focus: { path: [editor.children.length - 1, editor.children[editor.children.length - 1].children.length - 1], offset: editor.children[editor.children.length - 1].children.length - 1 }
						},
						{ focus: true }
					);
				}
				event.preventDefault();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [editor]);

	// useCallback because react shouldn't recreate the function on every render
	// debounce because keystroke changes are not important for the lix 1.0 preview
	// given that we do not have real-time collabroation and no feature yet to
	// delete changes/disregard keystroke changes on merge
	const handleUpdateMdData = useCallback(
		debounce(async (newData) => {
			const serializedMd = newData.editor.api.markdown.serialize();

			await lix.db
				.updateTable("file")
				.set("data", new TextEncoder().encode(serializedMd))
				.where("id", "=", activeFile!.id)
				.returningAll()
				.execute();

			// needed because lix is not writing to OPFS yet
			await saveLixToOpfs({ lix });
			console.log("saved to lix db");
			console.log(serializedMd);
		}, 500),
		[]
	);

	return (
		<DndProvider backend={HTML5Backend}>
			<Plate
				editor={editor}
				onValueChange={(newValue) => {
					if (
						loadedMd !==
						newValue.editor.getApi(ExtendedMarkdownPlugin).markdown.serialize()
					) {
						handleUpdateMdData(newValue);
						// console.log(
						// 	newValue.editor.api.markdown.serialize()
						// );
					} else {
						console.log("no change");
					}
				}}
			>
				<EditorContainer>
					<Editor />
				</EditorContainer>
				{/* <SettingsDialog /> */}
			</Plate>
		</DndProvider>
	);
}
