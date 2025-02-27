'use client';

import { cn } from "@udecode/cn";
import { Copy } from "lucide-react";
import { Button } from "../plate-ui/button";
import { idEnrichedSerializeMdNodesOptions } from "./id-enriched-serializer";
import { toast } from 'sonner';

export const CopyToClipboard = (
  editor: any,
) => {
  const handleCopyToClipboard = () => {
    const serializedMd = editor.editor.api.markdown.serialize({
      nodes: idEnrichedSerializeMdNodesOptions,
    });
    navigator.clipboard.writeText(serializedMd);
    toast.success('Markdown copied to clipboard');
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(
        'group absolute top-14 lg:top-12 right-1 lg:right-3 z-50 size-10 overflow-hidden',
        'rounded-md hover:shadow-lg hover:bg-slate-50 transition-shadow transition-bg',
      )}
      onClick={handleCopyToClipboard}
    >
      <Copy className="size-4" />
    </Button >

  );
}
