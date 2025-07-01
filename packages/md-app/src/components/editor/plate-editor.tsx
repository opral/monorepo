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
import { selectActiveFile } from "@/queries";
import { useMdAstState } from "@/hooks/useMdAstState";
import { mdastEntitiesToPlateValue, plateValueToMdastEntities } from "./mdast-plate-bridge";
import { ExtendedMarkdownPlugin } from "./plugins/markdown/markdown-plugin";
import { TElement } from "@udecode/plate";
import { getPromptDismissed, hasEmptyPromptElement, insertEmptyPromptElement, removeEmptyPromptElement, setPromptDismissed } from "@/helper/emptyPromptElementHelpers";
import { useLix } from "@lix-js/react-utils";
export function PlateEditor() {
  const lix = useLix();
  const [activeFile] = useQuery(selectActiveFile);
  const { state: mdAstState, updateEntities } = useMdAstState();
  const editorRef = useRef<any>(null);

  const editor = useCreateEditor();
  const [previousHasPromptElement, setPreviousHasPromptElement] = useState(false);

  useEffect(() => {
    if (editor && editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  useEffect(() => {
    if (editor && mdAstState.entities.length > 0) {
      try {
        // Convert MD-AST entities to Plate value
        const plateNodes = mdastEntitiesToPlateValue(mdAstState.entities, mdAstState.order);

        // Only update if the content has actually changed
        const currentValue = editor.children;
        const hasContentChanged = JSON.stringify(currentValue) !== JSON.stringify(plateNodes);

        if (hasContentChanged && plateNodes.length > 0) {
          editor.tf.setValue(plateNodes as any);
        }
      } catch (error) {
        console.error("Failed to load MD-AST content into Plate editor:", error);
        // Fallback: create empty paragraph
        editor.tf.setValue([{ type: 'p', children: [{ text: '' }] }]);
      }
    } else if (editor && mdAstState.entities.length === 0 && !mdAstState.isLoading) {
      // Empty document - create default paragraph
      editor.tf.setValue([{ type: 'p', children: [{ text: '' }] }]);
    }
    setPreviousHasPromptElement(false);
  }, [activeFile?.id, mdAstState, editor]);

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

        // Show prompt for default empty document or any empty file
        const isDefaultDocument = activeFile.path === "/document.md";
        const isEmptyFile = mdAstState.entities.length === 0;

        if (isDefaultDocument || isEmptyFile) {
          insertEmptyPromptElement(editor);
          return;
        }
      } catch (error) {
        console.error("Error checking prompt status:", error);
      }
    };

    checkAndAddPrompt();
  }, [editor, mdAstState, lix, activeFile]);

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
  }, [editor, mdAstState]); // Include mdAstState to re-attach event listener when content changes

  // useCallback because react shouldn't recreate the function on every render
  // debounce because keystroke changes are not important for the lix 1.0 preview
  // given that we do not have real-time collabroation and no feature yet to
  // delete changes/disregard keystroke changes on merge
  const handleUpdateMdData = useCallback(
    debounce(async (newData) => {
      // Only save if we have an active file and lix
      if (!activeFile || !lix) return;

      try {
        // Convert Plate value to MD-AST entities
        const plateValue = newData.editor.children;
        const { entities, order } = plateValueToMdastEntities(plateValue);

        // Update MD-AST entities in lix state using the hook
        await updateEntities(entities, order);

        // OpfsStorage now handles persistence automatically through the onStateCommit hook
      } catch (error) {
        console.error("Failed to save MD-AST entities:", error);
        // Fallback to markdown-based saving for now
        const serializedMd = newData.editor.getApi(ExtendedMarkdownPlugin).markdown.serialize();
        await lix.db
          .updateTable("file")
          .set("data", new TextEncoder().encode(serializedMd))
          .where("id", "=", activeFile.id)
          .execute();
        // OpfsStorage now handles persistence automatically through the onStateCommit hook
      }
    }, 500),
    [lix, activeFile?.id, updateEntities] // Include updateEntities in dependencies
  );

  // Memoize the value change handler to avoid unnecessary re-renders
  const handleValueChange = useCallback((newValue: any) => {
    if (!activeFile || !lix) return; // Don't save if no active file or lix

    const hasPromptElement = hasEmptyPromptElement(newValue.editor);

    // If there was a prompt but now it's gone, mark it as dismissed
    if (previousHasPromptElement && !hasPromptElement && activeFile.id) {
      setPromptDismissed(lix, activeFile.id);
    }

    setPreviousHasPromptElement(hasPromptElement);

    // Check if content has changed by comparing current entities with new Plate value
    try {
      const plateValue = newValue.editor.children;
      const { entities: newEntities } = plateValueToMdastEntities(plateValue);

      // Simple comparison - in a real implementation, this would be more sophisticated
      const hasContentChanged = mdAstState.entities.length === 0 ||
        JSON.stringify(newEntities) !== JSON.stringify(mdAstState.entities);

      if (hasContentChanged) {
        handleUpdateMdData(newValue);
      }
    } catch (error) {
      console.error("Error comparing content for save:", error);
      // Fallback: always save on change
      handleUpdateMdData(newValue);
    }

  }, [mdAstState, handleUpdateMdData, activeFile, lix, editor, previousHasPromptElement]);

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
