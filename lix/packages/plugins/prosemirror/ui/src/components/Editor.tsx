import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from './setup';

// Create a schema with basic nodes and list support
const schema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, {
    bullet: { content: 'paragraph block*' },
    ordered: { content: 'paragraph block*' },
    listItem: { 
      content: 'paragraph block*',
      toDOM: () => ["li", 0],
      parseDOM: [{ tag: "li" }],
    }
  }, 'paragraph block*'),
  marks: basicSchema.spec.marks
});

interface EditorProps {
  onChange: (doc: any) => void;
}

const Editor: React.FC<EditorProps> = ({ onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create an initial state with some content
    const state = EditorState.create({
      schema,
      doc: schema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ProseMirror!' }
            ]
          }
        ]
      }),
      plugins: exampleSetup({ schema })
    });

    // Set up change handler
    const dispatchTransaction = (transaction: Transaction) => {
      const newState = view!.state.apply(transaction);
      view!.updateState(newState);
      
      // Call onChange with the new document
      if (transaction.docChanged) {
        const jsonDoc = newState.doc.toJSON();
        onChange(jsonDoc);
      }
    };

    // Initialize the editor view
    const editorView = new EditorView(editorRef.current, {
      state,
      dispatchTransaction
    });

    setView(editorView);

    return () => {
      editorView.destroy();
    };
  }, [onChange]);

  // Add heading buttons
  const addHeading = (level: number) => {
    if (!view) return;
    
    const { state, dispatch } = view;
    const nodeType = schema.nodes.heading;
    
    if (!nodeType) return;
    
    const transaction = state.tr.replaceSelectionWith(
      nodeType.create({ level }, state.schema.text('Heading ' + level))
    );
    
    dispatch(transaction);
  };

  // Add list buttons
  const addList = (listType: 'bullet_list' | 'ordered_list') => {
    if (!view) return;
    
    const { state, dispatch } = view;
    const listNodeType = schema.nodes[listType];
    const listItemNodeType = schema.nodes.list_item;
    
    if (!listNodeType || !listItemNodeType) return;
    
    const transaction = state.tr.replaceSelectionWith(
      listNodeType.create(null, [
        listItemNodeType.create(null, [
          schema.nodes.paragraph.create(null, [
            schema.text('List item')
          ])
        ])
      ])
    );
    
    dispatch(transaction);
  };

  // Add blockquote
  const addBlockquote = () => {
    if (!view) return;
    
    const { state, dispatch } = view;
    const nodeType = schema.nodes.blockquote;
    
    if (!nodeType) return;
    
    const transaction = state.tr.replaceSelectionWith(
      nodeType.create(null, [
        schema.nodes.paragraph.create(null, [
          schema.text('Blockquote text')
        ])
      ])
    );
    
    dispatch(transaction);
  };

  // Add code block
  const addCodeBlock = () => {
    if (!view) return;
    
    const { state, dispatch } = view;
    const nodeType = schema.nodes.code_block;
    
    if (!nodeType) return;
    
    const transaction = state.tr.replaceSelectionWith(
      nodeType.create(null, [schema.text('function hello() {\n  console.log("Hello world!");\n}')])
    );
    
    dispatch(transaction);
  };

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button onClick={() => addHeading(1)}>H1</button>
        <button onClick={() => addHeading(2)}>H2</button>
        <button onClick={() => addHeading(3)}>H3</button>
        <button onClick={() => addList('bullet_list')}>Bullet List</button>
        <button onClick={() => addList('ordered_list')}>Ordered List</button>
        <button onClick={addBlockquote}>Blockquote</button>
        <button onClick={addCodeBlock}>Code Block</button>
      </div>
      <div ref={editorRef} className="editor" />
    </div>
  );
};

export default Editor;