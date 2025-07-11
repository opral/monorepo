

import * as React from 'react';

import { isType } from '@udecode/plate';
import { BlockquotePlugin } from '@udecode/plate-block-quote/react';
import { CodeBlockPlugin } from '@udecode/plate-code-block/react';
import { useDraggable, useDropLine } from '@udecode/plate-dnd';
import { ExcalidrawPlugin } from '@udecode/plate-excalidraw/react';
import { HEADING_KEYS } from '@udecode/plate-heading';
import { ColumnItemPlugin, ColumnPlugin } from '@udecode/plate-layout/react';
import {
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
} from '@udecode/plate-media/react';
import { BlockSelectionPlugin } from '@udecode/plate-selection/react';
import {
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from '@udecode/plate-table/react';
import { TogglePlugin } from '@udecode/plate-toggle/react';
import {
  type PlateElementProps,
  type RenderNodeWrapper,
  MemoizedChildren,
  ParagraphPlugin,
  useEditorRef,
  useElement,
  usePath,
  usePluginOption,
} from '@udecode/plate/react';
import { useReadOnly, useSelected } from '@udecode/plate/react';
import { GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { STRUCTURAL_TYPES } from '@/components/editor/transforms';

const UNDRAGGABLE_KEYS = [
  ColumnItemPlugin.key,
  TableRowPlugin.key,
  TableCellPlugin.key,
];

export const DraggableAboveNodes: RenderNodeWrapper = (props) => {
  const { editor, element, path } = props;
  const readOnly = useReadOnly();

  const enabled = React.useMemo(() => {
    if (readOnly) return false;
    if (path && path.length === 1 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      return true;
    }
    if (path && path.length === 3 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      const block = editor.api.some({
        at: path,
        match: {
          type: editor.getType(ColumnPlugin),
        },
      });

      if (block) {
        return true;
      }
    }
    if (path && path.length === 4 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      const block = editor.api.some({
        at: path,
        match: {
          type: editor.getType(TablePlugin),
        },
      });

      if (block) {
        return true;
      }
    }

    return false;
  }, [editor, element, path, readOnly]);

  if (!enabled) return;

  return (props) => <Draggable {...props} />;
};

export function Draggable(props: PlateElementProps) {
  const { children, editor, element, path } = props;
  const blockSelectionApi = editor.getApi(BlockSelectionPlugin).blockSelection;
  const { isDragging, previewRef, handleRef } = useDraggable({
    element,
    onDropHandler: (_, { dragItem }) => {
      const id = (dragItem as { id: string }).id;

      if (blockSelectionApi && id) {
        blockSelectionApi.set(id);
      }
    },
  });

  const isInColumn = path.length === 3;
  const isInTable = path.length === 4;

  return (
    <div
      className={cn(
        'relative',
        isDragging && 'opacity-50',
        STRUCTURAL_TYPES.includes(element.type) ? 'group/structural' : 'group'
      )}
    >
      {!isInTable && (
        <Gutter>
          <div
            className={cn(
              'slate-blockToolbarWrapper',
              'flex h-[1.5em]',
              isType(editor, element, [
                HEADING_KEYS.h1,
                HEADING_KEYS.h2,
                HEADING_KEYS.h3,
                HEADING_KEYS.h4,
                HEADING_KEYS.h5,
              ]) && 'h-[1.3em]',
              isInColumn && 'h-4'
            )}
          >
            <div
              className={cn(
                'slate-blockToolbar',
                'pointer-events-auto mr-1 flex items-center',
                isInColumn && 'mr-1.5'
              )}
            >
              <Button
                ref={handleRef}
                variant="ghost"
                className="h-6 w-4.5 p-0"
                data-plate-prevent-deselect
              >
                <DragHandle />
              </Button>
            </div>
          </div>
        </Gutter>
      )}

      <div ref={previewRef} className="slate-blockWrapper">
        <MemoizedChildren>{children}</MemoizedChildren>
        <DropLine />
      </div>
    </div>
  );
}

function Gutter({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const editor = useEditorRef();
  const element = useElement();
  const path = usePath();
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible'
  );
  const selected = useSelected();

  const isNodeType = (keys: string[] | string) => isType(editor, element, keys);

  const isInColumn = path.length === 3;

  return (
    <div
      {...props}
      className={cn(
        'slate-gutterLeft',
        'absolute top-0 z-50 flex h-full -translate-x-full cursor-text hover:opacity-100 sm:opacity-0',
        STRUCTURAL_TYPES.includes(element.type)
          ? 'group-hover/structural:opacity-100'
          : 'group-hover:opacity-100',
        isSelectionAreaVisible && 'hidden',
        !selected && 'opacity-0',
        isNodeType(HEADING_KEYS.h1) && 'pb-1 text-[1.875em]',
        isNodeType(HEADING_KEYS.h2) && 'pb-1 text-[1.5em]',
        isNodeType(HEADING_KEYS.h3) && 'pt-[2px] pb-1 text-[1.25em]',
        isNodeType([HEADING_KEYS.h4, HEADING_KEYS.h5]) &&
        'pt-1 pb-0 text-[1.1em]',
        isNodeType(HEADING_KEYS.h6) && 'pb-0',
        isNodeType(ParagraphPlugin.key) && 'pt-1 pb-0',
        isNodeType(['ul', 'ol']) && 'pb-0',
        isNodeType(BlockquotePlugin.key) && 'pb-0',
        isNodeType(CodeBlockPlugin.key) && 'pt-6 pb-0',
        isNodeType([
          ImagePlugin.key,
          MediaEmbedPlugin.key,
          ExcalidrawPlugin.key,
          TogglePlugin.key,
          ColumnPlugin.key,
        ]) && 'py-0',
        isNodeType([PlaceholderPlugin.key, TablePlugin.key]) && 'pt-3 pb-0',
        isInColumn && 'mt-2 h-4 pt-0',
        className
      )}
      contentEditable={false}
    >
      {children}
    </div>
  );
}

const DragHandle = React.memo(function DragHandle() {
  const editor = useEditorRef();
  const element = useElement();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex size-full items-center justify-center"
          onClick={() => {
            editor
              .getApi(BlockSelectionPlugin)
              .blockSelection.set(element.id as string);
          }}
          role="button"
        >
          <GripVertical className="text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent>Drag to move</TooltipContent>
    </Tooltip>
  );
});

const DropLine = React.memo(function DropLine({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;

  return (
    <div
      {...props}
      className={cn(
        'slate-dropLine',
        'absolute inset-x-0 h-0.5 opacity-100 transition-opacity',
        'bg-brand/50',
        dropLine === 'top' && '-top-px',
        dropLine === 'bottom' && '-bottom-px',
        className
      )}
    />
  );
});
