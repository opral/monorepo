import * as React from 'react';
import { useAtom } from 'jotai/react';
import { useMemo } from 'react';
import {
  type PlateElementProps,
  type RenderNodeWrapper,
} from '@udecode/plate/react';
import { useReadOnly } from '@udecode/plate/react';
import { createPlatePlugin } from '@udecode/plate/react';
import { NodeApi } from '@udecode/plate';
import { cn } from '@/lib/utils';
import { intermediateChangesAtom, activeFileAtom } from '@/state-active-file';

// Change indicator component
const ChangeIndicator = React.memo(function ChangeIndicator({
  type,
  className
}: {
  type: 'added' | 'modified' | 'deleted';
  className?: string;
}) {
  const indicatorColor = type === 'added' ? 'bg-green-500' :
    type === 'modified' ? 'bg-blue-500' :
      'bg-red-500';

  const title = type === 'added' ? 'Line was added' :
    type === 'modified' ? 'Line was modified' :
      'Line was deleted';

  return (
    <div
      className="absolute -left-14 top-0 w-10 h-full z-10 cursor-pointer group/hover"
      title={title}
    >
      <div
        className={cn(
          'absolute right-2 top-0 w-1 h-full opacity-50 group-hover/hover:opacity-100 group-hover/hover:w-2 transition-all',
          indicatorColor,
          className
        )}
      />
    </div>
  );
});

// Main wrapper component that shows change indicators
export const ChangeIndicatorAboveNodes: RenderNodeWrapper = (props) => {
  const { path } = props;
  const readOnly = useReadOnly();

  const enabled = React.useMemo(() => {
    return !readOnly;
  }, [path, readOnly]);

  if (!enabled) return;

  return (props) => <ChangeIndicatorWrapper {...props} />;
};

// Helper function to extract text content from a block element using Plate API
const getBlockText = (element: any): string => {
  try {
    // Use NodeApi.string to properly extract text from Plate elements
    return NodeApi.string(element) || '';
  } catch {
    // Fallback: if element has text property directly
    if (element?.text) {
      return element.text;
    }
    // Final fallback
    return '';
  }
};

function ChangeIndicatorWrapper(props: PlateElementProps) {
  const { children, element } = props;
  const [intermediateChanges] = useAtom(intermediateChangesAtom);
  const [activeFile] = useAtom(activeFileAtom);

  // For txt plugin, changes are tracked at the file level
  // Find document-level changes for the current file
  const documentChanges = useMemo(() => {
    if (!activeFile) return [];

    return intermediateChanges.filter(change => {
      // For txt plugin, entity_id is the file ID
      return change.entity_id === activeFile.id;
    });
  }, [intermediateChanges, activeFile]);

  // Determine if this specific block has changed
  const blockChangeInfo = useMemo(() => {
    console.log('🔍 ChangeIndicator: Starting analysis for element:', element.type);

    if (documentChanges.length === 0 || !activeFile) {
      console.log('❌ ChangeIndicator: No changes or no active file');
      return null;
    }

    // Find the most recent document change
    const latestChange = documentChanges[0];
    if (!latestChange) {
      console.log('❌ ChangeIndicator: No latest change found');
      return null;
    }

    console.log('📄 ChangeIndicator: Latest change:', {
      entity_id: latestChange.entity_id,
      has_before: !!latestChange.snapshot_content_before,
      has_after: !!latestChange.snapshot_content_after
    });

    // Get the text content before and after from the change
    const beforeText = latestChange.snapshot_content_before?.text || '';
    const afterText = latestChange.snapshot_content_after?.text || '';

    console.log('📝 ChangeIndicator: Text comparison:', {
      beforeText: beforeText.slice(0, 50), // Show first 50 chars for brevity
      afterText: afterText.slice(0, 50), // Show first 50 chars for brevity
      beforeLength: beforeText.length,
      afterLength: afterText.length,
      textsEqual: beforeText === afterText
    });

    // If no change in text content, no indicators needed
    if (beforeText === afterText) {
      console.log('✅ ChangeIndicator: Texts are identical, no changes');
      return null;
    }

    // If after is null, this represents a deletion
    if (latestChange.snapshot_content_after === null) {
      console.log('🗑️ ChangeIndicator: File deleted');
      return { type: 'deleted', isThisBlockChanged: true };
    }

    // For txt plugin, we need to determine if this specific block/line has changed
    // Get the current block's text content
    const currentBlockText = getBlockText(element);
    const currentBlockTextTrimmed = currentBlockText.trim();

    console.log('🎯 ChangeIndicator: Current block text:', `"${currentBlockTextTrimmed}"`);

    // Skip empty blocks - they shouldn't show indicators
    if (!currentBlockTextTrimmed) {
      console.log('⚪ ChangeIndicator: Empty block, skipping');
      return null;
    }

    // Split both texts into lines to compare
    const beforeLines = beforeText.split('\n').map((line: string) => line.trim()).filter((line: string) => line);
    const afterLines = afterText.split('\n').map((line: string) => line.trim()).filter((line: string) => line);

    console.log('📊 ChangeIndicator: Line analysis:', {
      beforeLinesCount: beforeLines.length,
      afterLinesCount: afterLines.length,
      beforeLines: beforeLines,
      afterLines: afterLines
    });

    // Find the line number of current block in the after state
    const currentLineIndexInAfter = afterLines.findIndex((line: string) => line === currentBlockTextTrimmed);

    console.log('🔎 ChangeIndicator: Line position in after:', currentLineIndexInAfter);

    // If current block doesn't exist in after state, something is wrong
    if (currentLineIndexInAfter === -1) {
      console.log('❌ ChangeIndicator: Current block not found in after state');
      return null;
    }

    // Check if this line exists in the before state
    const existsInBefore = beforeLines.includes(currentBlockTextTrimmed);

    console.log('🧪 ChangeIndicator: Line existence check:', {
      currentText: currentBlockTextTrimmed,
      existsInBefore,
      existsInAfter: true // We know it exists since we found it
    });

    // Case 1: Line is completely new (doesn't exist in before)
    if (!existsInBefore) {
      console.log('🆕 NEW LINE DETECTED:', currentBlockTextTrimmed);
      return { type: 'added', isThisBlockChanged: true };
    }

    // Case 2: Line exists in both, but check if it's in the same position
    const beforeLineIndex = beforeLines.findIndex((line: string) => line === currentBlockTextTrimmed);

    console.log('📍 ChangeIndicator: Position comparison:', {
      beforeLineIndex,
      currentLineIndexInAfter,
      moved: beforeLineIndex !== currentLineIndexInAfter
    });

    // If line moved position, consider it changed
    if (beforeLineIndex !== currentLineIndexInAfter) {
      console.log('🔄 LINE MOVED:', { beforeLineIndex, currentLineIndexInAfter });
      return { type: 'modified', isThisBlockChanged: true };
    }

    // Case 3: If document has any changes and we have fewer lines before than after, 
    // this suggests lines were added, so show indicators on all existing lines too
    if (afterLines.length > beforeLines.length) {
      console.log('📈 DOCUMENT GREW - showing indicator on existing line');
      return { type: 'modified', isThisBlockChanged: true };
    }// Case 3: Check if surrounding context changed (lines above/below are different)
    const hasContextChanged = () => {
      // Check line above
      if (currentLineIndexInAfter > 0) {
        const lineAboveInAfter = afterLines[currentLineIndexInAfter - 1];
        const lineAboveInBefore = beforeLineIndex > 0 ? beforeLines[beforeLineIndex - 1] : null;
        if (lineAboveInAfter !== lineAboveInBefore) return true;
      }

      // Check line below
      if (currentLineIndexInAfter < afterLines.length - 1) {
        const lineBelowInAfter = afterLines[currentLineIndexInAfter + 1];
        const lineBelowInBefore = beforeLineIndex < beforeLines.length - 1 ? beforeLines[beforeLineIndex + 1] : null;
        if (lineBelowInAfter !== lineBelowInBefore) return true;
      }

      return false;
    };

    // Show indicator if context changed (new lines added around this line)
    if (hasContextChanged()) {
      return { type: 'modified', isThisBlockChanged: true };
    }

    // Debug logging to understand what's happening
    console.log('ChangeIndicator Debug:', {
      currentBlockText: currentBlockTextTrimmed,
      existsInBefore,
      beforeLineIndex,
      currentLineIndexInAfter,
      beforeLinesCount: beforeLines.length,
      afterLinesCount: afterLines.length,
      beforeLines: beforeLines.slice(0, 5), // First 5 lines
      afterLines: afterLines.slice(0, 5),   // First 5 lines
    });

    return null;
  }, [documentChanges, activeFile, element, children]);

  // Only show indicators for blocks that have actually changed
  const shouldShowIndicator = useMemo(() => {
    // Check if this block type is supported
    const blockTypes = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'text'];
    const isSupportedType = blockTypes.includes(element.type);

    // Only show indicator if this specific block has changed
    return isSupportedType && blockChangeInfo?.isThisBlockChanged === true;
  }, [element.type, blockChangeInfo]);


  return (
    <div className="relative group/indicator">
      {/* Single debug panel for the first paragraph only */}
      {/* {import.meta.env.DEV && (
        <div className="absolute -left-48 top-0 w-40 bg-yellow-200 text-black text-xs p-2 border border-yellow-600 z-30 hover:z-40">
          <div><strong>DEBUG PANEL</strong></div>
          <div>File ID: {activeFile?.id?.slice(-8) || 'None'}</div>
          <div>All Changes: {intermediateChanges.length}</div>
          <div>Doc Changes: {documentChanges.length}</div>
          <div>Change Type: {blockChangeInfo?.type || 'None'}</div>
          <div>Block Changed: {blockChangeInfo?.isThisBlockChanged ? 'Yes' : 'No'}</div>
          <div>Element: {element.type}</div>
          <div>Should Show: {shouldShowIndicator ? 'Yes' : 'No'}</div>
          <div>Block Text: "{getBlockText(element).slice(0, 20)}..."</div>
          {intermediateChanges.length > 0 && (
            <div>First Entity: {intermediateChanges[0]?.entity_id?.slice(-8)}</div>
          )}
        </div>
      )} */}

      {blockChangeInfo && shouldShowIndicator && (
        <ChangeIndicator
          type={blockChangeInfo.type as 'added' | 'modified' | 'deleted'}
        />
      )}
      <div className={cn(
        'pl-2',
        'transition-all duration-200'
      )}>
        {children}
      </div>
    </div>
  );
}

// Plugin configuration
export const changeIndicatorPlugin = createPlatePlugin({
  key: 'change-indicator',
  render: {
    aboveNodes: ChangeIndicatorAboveNodes,
  },
});
