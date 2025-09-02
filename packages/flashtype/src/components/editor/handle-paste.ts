import { astToTiptapDoc } from "@opral/markdown-wc/tiptap";
import { parseMarkdown } from "@opral/markdown-wc";

export async function handlePaste(args: {
  editor: any;
  event: ClipboardEvent | any;
}): Promise<boolean> {
  const { editor, event } = args;

  // Get clipboard text
  const text = event?.clipboardData?.getData?.("text/plain") ?? "";
  if (!text) return false; // let default handlers run

  // Prevent default paste behavior
  event.preventDefault?.();

  // Parse markdown to TipTap document structure
  const ast = parseMarkdown(text);
  const tiptapDoc = astToTiptapDoc(ast) as any;
  const blockFragment = tiptapDoc?.content ?? [];

  // Insert at current cursor position/selection explicitly
  if (editor?.state?.selection && editor.commands?.insertContentAt) {
    const sel = editor.state.selection as any;
    const { from, to, $from, $to } = sel;
    const isRange = from !== to;
    const inlineFrom = !!$from?.parent?.inlineContent;
    const inlineTo = !!$to?.parent?.inlineContent;

    if (isRange) {
      // Replace the selected range. If the range is inline, use inline content when possible.
      if (inlineFrom && inlineTo) {
        const first = Array.isArray(blockFragment) ? blockFragment[0] : null;
        const isSimpleParagraph = first && first.type === "paragraph" && Array.isArray(first.content);
        const inlineContent = isSimpleParagraph ? first.content : blockFragment;
        editor.commands.insertContentAt({ from, to } as any, inlineContent);
      } else {
        editor.commands.insertContentAt({ from, to } as any, blockFragment);
      }
      return true;
    }

    // Collapsed cursor: insert as blocks (new paragraphs before/after)
    editor.commands.insertContentAt(from as any, blockFragment);
    return true;
  }

  return false;
}
