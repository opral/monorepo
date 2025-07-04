import { Import } from "lucide-react";
import { useEditorRef } from "@udecode/plate/react";
import { useFilePicker } from 'use-file-picker';
import type { SelectedFilesOrErrors } from 'use-file-picker/types';
import { ExtendedMarkdownPlugin } from "./editor/plugins/markdown/markdown-plugin";
import { ToolbarButton } from "./ui/toolbar";

export const ImportMarkdown = () => {
  const editor = useEditorRef()
  const accept = ['.md'];

  const { openFilePicker } = useFilePicker({
    accept,
    multiple: false,
    readFilesContent: false,
    onFilesSelected: async (data: SelectedFilesOrErrors<undefined, unknown>) => {
      if (!data.plainFiles || data.plainFiles.length === 0) return;
      const text = await data.plainFiles[0].text();

      const nodes = editor.getApi(ExtendedMarkdownPlugin).markdown.deserialize(text);;

      editor.tf.insertNodes(nodes);
    },
  });

  return (
    <ToolbarButton
      tooltip={"Import from markdown"}
      className="hover:bg-muted hover:text-muted-foreground"
      onClick={openFilePicker}
    >
      <Import className="size-4" />
    </ToolbarButton>
  );
};
