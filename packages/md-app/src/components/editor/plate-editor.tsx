// import { DOMEditor } from 'slate-dom';
import { useCallback, useEffect, useState, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Plate } from "@udecode/plate/react";

import { useCreateEditor } from "@/components/editor/use-create-editor";
// import { SettingsDialog } from "@/components/editor/settings";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { debounce } from "lodash-es";
import { useQuery } from "@/hooks/useQuery";
import { selectLix, selectActiveFile, selectLoadedMarkdown } from "@/queries";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs";
import { ExtendedMarkdownPlugin } from "./plugins/markdown/markdown-plugin";
import { TElement } from "@udecode/plate";
import { welcomeMd } from "@/helper/welcomeLixFile";
import { getPromptDismissed, hasEmptyPromptElement, insertEmptyPromptElement, removeEmptyPromptElement, setPromptDismissed } from "@/helper/emptyPromptElementHelpers";
export function PlateEditor() {
  const [lix] = useQuery(selectLix);
  const [activeFile] = useQuery(selectActiveFile);
  const [loadedMd] = useQuery(selectLoadedMarkdown);
  const editorRef = useRef<any>(null);

  const editor = useCreateEditor();
  const [previousHasPromptElement, setPreviousHasPromptElement] = useState(false);

  useEffect(() => {
    if (editor && editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  useEffect(() => {
    if (editor && loadedMd !== undefined && loadedMd !== null) {
      const currentSerialized = editor.getApi(ExtendedMarkdownPlugin).markdown.serialize();
      if (loadedMd !== currentSerialized) {
        const nodes = editor
          .getApi(ExtendedMarkdownPlugin)
          .markdown.deserialize(loadedMd);
        editor.tf.setValue(nodes);
      }
    }
    setPreviousHasPromptElement(false);
  }, [activeFile?.id, loadedMd, editor]);

  useEffect(() => {
    if (!editor || !lix || !activeFile?.id) return;

    // The main function to check and potentially add a prompt
    const checkAndAddPrompt = async () => {
      try {
        // If prompt has been dismissed, don't show it
        if (await getPromptDismissed(lix, activeFile.id)) {
          removeEmptyPromptElement(editor);
          return;
        }

        // is more or less the same as the welcome file
        const isWelcomeFile = loadedMd === welcomeMd || activeFile.path === "/welcome.md";
        const isEmptyFile = loadedMd === "" || loadedMd === "<br />\n";

        if (isWelcomeFile || isEmptyFile) {
          insertEmptyPromptElement(editor);
          return;
        }
      } catch (error) {
        console.error("Error checking prompt status:", error);
      }
    };

    checkAndAddPrompt();
  }, [editor, loadedMd, lix, activeFile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        // if (!editor.api.isFocused()) {
        // 	editor.getApi(BlockSelectionPlugin).blockSelection.selectAll();
        // } else {

        // Only attempt to select all if we have editor content
        if (!editor || !editor.children || editor.children.length === 0 || (event.target as HTMLElement).tagName === "TEXTAREA") {
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
      // Only save if we have an active file and lix
      if (!activeFile || !lix) return;

      const serializedMd = newData.editor.getApi(ExtendedMarkdownPlugin).markdown.serialize();

      await lix.db
				.updateTable("file")
				.set("data", new TextEncoder().encode(serializedMd))
				.where("id", "=", activeFile.id)
				.execute();

      // needed because lix is not writing to OPFS yet
      await saveLixToOpfs({ lix });
    }, 500),
    [lix, activeFile?.id] // Include activeFile.id in dependencies
  );

  // Memoize the value change handler to avoid unnecessary re-renders
  const handleValueChange = useCallback((newValue: any) => {
    if (!activeFile || !lix) return; // Don't save if no active file or lix

    const newContent = newValue.editor.getApi(ExtendedMarkdownPlugin).markdown.serialize();
    const hasPromptElement = hasEmptyPromptElement(newValue.editor);

    // If there was a prompt but now it's gone, mark it as dismissed
    if (previousHasPromptElement && !hasPromptElement && activeFile.id) {
      setPromptDismissed(lix, activeFile.id);
    }

    setPreviousHasPromptElement(hasPromptElement);

    if (loadedMd !== newContent) {
      handleUpdateMdData(newValue);
    }

  }, [loadedMd, handleUpdateMdData, activeFile, lix, editor, previousHasPromptElement]);

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
