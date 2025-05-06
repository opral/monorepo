

import { BlockSelectionPlugin } from '@udecode/plate-selection/react';

import { BlockSelection } from '@/components/plate-ui/block-selection';
import { ExtendedMarkdownPlugin } from "./markdown/markdown-plugin";

export const blockSelectionPlugins: any = [
  BlockSelectionPlugin.configure(({ editor }) => ({
    options: {
      enableContextMenu: true,
      isSelectable: (element, path) => {
        return (
          !['code_line', 'column', 'td'].includes(element.type) &&
          !editor.api.block({ above: true, at: path, match: { type: 'tr' } })
        );
      },
    },
    onKeyDownSelecting: (event: KeyboardEvent) => {
      // Detect Meta + C (Cmd + C on macOS, Ctrl + C elsewhere)
      const isCopyShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c";

      if (!isCopyShortcut) return;

      // Get selected block nodes from the BlockSelectionPlugin
      const selectedNodes = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes();
      if (!selectedNodes || selectedNodes.length === 0) return;

      // Serialize only the selected block nodes to Markdown
      const markdown = editor.getApi(ExtendedMarkdownPlugin).markdown.serialize({
        value: selectedNodes as any,
      });

      window.navigator.clipboard.writeText(markdown);
      event.preventDefault();
    },
    render: {
      belowRootNodes: (props) => {
        if (!props.className?.includes('slate-selectable')) return null;

        return <BlockSelection />;
      },
    },
  })),
] as const;

export const blockSelectionReadOnlyPlugin: any = BlockSelectionPlugin.configure({
  api: {},
  extendEditor: null,
  handlers: {},
  options: {},
  render: {},
  useHooks: null,
});
