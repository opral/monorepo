'use client';

import { useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Plate } from '@udecode/plate/react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { SettingsDialog } from '@/components/editor/settings';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';
import { debounce } from 'lodash-es';
import { useAtom } from 'jotai';
import { lixAtom } from '@/state';
import { activeFileAtom, loadedMdAtom } from '@/state-active-file';
import { saveLixToOpfs } from '@/helper/saveLixToOpfs';

export function PlateEditor() {
  const [lix] = useAtom(lixAtom);
  const [activeFile] = useAtom(activeFileAtom);
  const [loadedMd] = useAtom(loadedMdAtom);

  const editor = useCreateEditor();

  // Set the initial value of the editor
  useEffect(() => {
    if (loadedMd !== editor.api.markdown.serialize()) {
      editor.tf.setValue(editor.api.markdown.deserialize(loadedMd))
    }
  }, []);

  // useCallback because react shouldn't recreate the function on every render
  // debounce because keystroke changes are not important for the lix 1.0 preview
  // given that we do not have real-time collabroation and no feature yet to
  // delete changes/disregard keystroke changes on merge
  const handleUpdateMdData = useCallback(
    debounce(async (newData) => {
      // console.log(newData);
      const serializedMd = newData.editor.api.markdown.serialize();
      // console.log(serializedMd);

      await lix.db
        .updateTable("file")
        .set("data", new TextEncoder().encode(serializedMd))
        .where("id", "=", activeFile!.id)
        .returningAll()
        .execute();

      // needed because lix is not writing to OPFS yet
      await saveLixToOpfs({ lix });
      console.log('saved to lix db');
    }, 500),
    []
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Plate
        editor={editor}
        onValueChange={(newValue) => {
          if (loadedMd !== newValue.editor.api.markdown.serialize()) {
            handleUpdateMdData(newValue)
          } else {
            console.log('no change');
          }
        }}
      >
        <EditorContainer>
          <Editor />
        </EditorContainer>
        <SettingsDialog />
      </Plate>
    </DndProvider>
  );
}
