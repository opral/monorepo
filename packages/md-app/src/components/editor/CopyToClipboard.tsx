

import { Copy } from "lucide-react";
import { Button } from "../plate-ui/button";
import { toast } from 'sonner';
import { useEditorRef } from "@udecode/plate/react";

export const CopyToClipboard = () => {
  const editor = useEditorRef()
  const handleCopyToClipboard = () => {
    // @ts-expect-error - api markdown is not in the types
    const serializedMd = editor.api.markdown.serialize();
    navigator.clipboard.writeText(serializedMd);
    toast.success('Markdown copied to clipboard');
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="hover:bg-muted hover:text-muted-foreground"
      onClick={handleCopyToClipboard}
    >
      <Copy className="size-4" />
    </Button >

  );
}
