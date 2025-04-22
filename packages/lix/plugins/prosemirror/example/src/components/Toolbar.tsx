import React from 'react';
import { EditorView } from 'prosemirror-view';
import { toggleMark } from 'prosemirror-commands';
import { wrapInList } from 'prosemirror-schema-list';
import { schema } from '../prosemirror/schema';
import { Bold, Italic, List } from 'lucide-react'; // Using lucide icons

interface ToolbarProps {
  view: EditorView | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ view }) => {
  if (!view) {
    return null; // Don't render if view is not available
  }

  const handleBold = () => {
    toggleMark(schema.marks.strong)(view.state, view.dispatch, view);
    view.focus(); // Refocus editor after command
  };

  const handleItalic = () => {
    toggleMark(schema.marks.em)(view.state, view.dispatch, view);
    view.focus();
  };

  const handleBulletList = () => {
    wrapInList(schema.nodes.bulletList)(view.state, view.dispatch, view);
    view.focus();
  };

  // TODO: Add logic to check if marks/nodes are active for button styling

  return (
    <div className="toolbar flex items-center space-x-2 p-2 bg-base-200 border-b border-base-300">
      <button
        className="btn btn-sm btn-ghost"
        title="Bold (Cmd/Ctrl+B)"
        onClick={handleBold}
        // Add disabled={!toggleMark(schema.marks.strong)(view.state)} for better UX?
      >
        <Bold size={16} />
      </button>
      <button
        className="btn btn-sm btn-ghost"
        title="Italic (Cmd/Ctrl+I)"
        onClick={handleItalic}
        // Add disabled={!toggleMark(schema.marks.em)(view.state)}
      >
        <Italic size={16} />
      </button>
      <button
        className="btn btn-sm btn-ghost"
        title="Bullet List (Shift+Ctrl+8)"
        onClick={handleBulletList}
        // Add disabled={!wrapInList(schema.nodes.bulletList)(view.state)}
      >
        <List size={16} />
      </button>
    </div>
  );
};

export default Toolbar;
