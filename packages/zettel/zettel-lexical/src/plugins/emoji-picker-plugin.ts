// Emoji Picker Plugin for Lexical (non-JSX, vanilla TS)
// Shows emoji-picker-element when user types ':' and inserts emoji at caret

import 'emoji-picker-element';
import { $insertNodes, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW } from 'lexical';

let picker: HTMLElement | null = null;
let active = false;
let currentEditor: any = null;
let currentQuery: string | null = null;
let currentRange: Range | null = null;

function showInlineEmojiPicker(editor: any, query: string, range: Range) {
  currentEditor = editor;
  currentQuery = query;
  currentRange = range;
  if (!picker) {
    picker = document.createElement('emoji-picker');
    picker.style.position = 'absolute';
    picker.style.zIndex = '1000';
    picker.style.minWidth = '320px';
    picker.tabIndex = -1;
    document.body.appendChild(picker);
    picker.addEventListener('emoji-click', onEmojiClick);
    document.addEventListener('mousedown', onClickOutside);
  }
  (picker as any).search = query;
  positionPicker(range);
  active = true;
  picker.style.display = 'block';
}

function hidePicker() {
  if (picker) {
    picker.style.display = 'none';
    picker.removeEventListener('emoji-click', onEmojiClick);
    document.removeEventListener('mousedown', onClickOutside);
    document.body.removeChild(picker);
    picker = null;
    active = false;
    currentQuery = null;
    currentRange = null;
  }
}

function onEmojiClick(e: any) {
  const emoji = e.detail.unicode;
  if (currentEditor && currentRange) {
    currentEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchor = selection.anchor;
        const node = anchor.getNode();
        // Only operate if node is a TextNode
        if (typeof node.getTextContent === 'function' && typeof selection.setTextNodeRange === 'function') {
          // Move selection to cover the :query
          selection.setTextNodeRange(
            node,
            currentRange.startOffset,
            node,
            currentRange.endOffset
          );
          selection.insertText(emoji);
        }
      }
    });
  }
  hidePicker();
}

function onClickOutside(e: any) {
  if (picker && !picker.contains(e.target)) {
    hidePicker();
  }
}

function positionPicker(range: Range) {
  let rect = range.getBoundingClientRect();
  if (rect.x === 0 && rect.y === 0) {
    rect = { left: window.innerWidth / 2, top: window.innerHeight / 2, height: 0 } as DOMRect;
  }
  if (picker) {
    picker.style.left = `${rect.left}px`;
    picker.style.top = `${rect.top + rect.height + 4}px`;
  }
}

export function registerEmojiPickerPlugin(editor: any) {
  // Listen for editor updates to detect :query triggers
  return editor.registerUpdateListener(({editorState}) => {
    editorState.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        hidePicker();
        return;
      }
      const anchor = selection.anchor;
      const node = anchor.getNode();
      const text = node.getTextContent();
      const offset = anchor.offset;
      // Find the last colon before the caret
      const before = text.slice(0, offset);
      const match = before.match(/:(\w{1,30})$/);
      if (match) {
        const query = match[1];
        // Get the DOM Range for :query
        const domRange = window.getSelection()?.getRangeAt(0).cloneRange();
        if (domRange) {
          // Move start to the colon
          domRange.setStart(domRange.startContainer, offset - query.length - 1);
          showInlineEmojiPicker(editor, query, domRange);
        }
      } else {
        hidePicker();
      }
    });
  });
}
