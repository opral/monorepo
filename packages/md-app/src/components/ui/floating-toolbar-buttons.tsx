

import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  // UnderlinePlugin,
} from '@udecode/plate-basic-marks/react';
import { useEditorReadOnly } from '@udecode/plate/react';
import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikethroughIcon,
  // UnderlineIcon,
  ZapIcon,
} from 'lucide-react';

import { AIToolbarButton } from './ai-toolbar-button';
// import { CommentToolbarButton } from './comment-toolbar-button';
// import { InlineEquationToolbarButton } from './inline-equation-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
// import { MoreDropdownMenu } from './more-dropdown-menu';
// import { SuggestionToolbarButton } from './suggestion-toolbar-button';
import { ToolbarGroup } from './toolbar';
import { TurnIntoDropdownMenu } from './turn-into-dropdown-menu';
import { getModKey } from '@/helper/modKey';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <AIToolbarButton tooltip={`AI commands (${getModKey()}+J)`}>
              <ZapIcon />
              Ask AI
            </AIToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <TurnIntoDropdownMenu />

            <MarkToolbarButton nodeType={BoldPlugin.key} tooltip={`Bold (${getModKey()}+B)`}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={ItalicPlugin.key}
              tooltip={`Italic (${getModKey()}+I)`}
            >
              <ItalicIcon />
            </MarkToolbarButton>

            {/* <MarkToolbarButton
              nodeType={UnderlinePlugin.key}
              tooltip={`Underline (${getModKey()}+U)`}
            >
              <UnderlineIcon />
            </MarkToolbarButton> */}

            <MarkToolbarButton
              nodeType={StrikethroughPlugin.key}
              tooltip={`Strikethrough (${getModKey()}+⇧+M)`}
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={CodePlugin.key} tooltip={`Code (${getModKey()}+E)`}>
              <Code2Icon />
            </MarkToolbarButton>

            {/* <InlineEquationToolbarButton /> */}

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}

      {/* <ToolbarGroup>
        <CommentToolbarButton />
        <SuggestionToolbarButton />

        {!readOnly && <MoreDropdownMenu />}
      </ToolbarGroup> */}
    </>
  );
}
