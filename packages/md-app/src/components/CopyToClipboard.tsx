import { Copy } from "lucide-react";
import { toast } from 'sonner';
import { useEditorRef } from "@udecode/plate/react";
import { ExtendedMarkdownPlugin } from "./editor/plugins/markdown/markdown-plugin";
import { ToolbarButton } from "./plate-ui/toolbar";

export const CopyToClipboard = () => {
  const editor = useEditorRef()
  const handleCopyToClipboard = () => {
    const serializedMd = editor.getApi(ExtendedMarkdownPlugin).markdown.serialize();
    navigator.clipboard.writeText(serializedMd);
    toast.success('Markdown copied to clipboard');
  };

  return (
    <ToolbarButton
      tooltip={"Copy markdown"}
      className="hover:bg-muted hover:text-muted-foreground"
      onClick={handleCopyToClipboard}
    >
      <Copy className="size-4" />
    </ToolbarButton >

  );
}
