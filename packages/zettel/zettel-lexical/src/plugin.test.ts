import { beforeEach, expect, test } from "vitest";
import { registerZettelLexicalPlugin } from "./plugin.js";
import {
  $createZettelSpanNode,
  $createZettelTextBlockNode,
  ZettelNodes,
} from "./nodes.js";
import { $getRoot, createEditor, KEY_ENTER_COMMAND } from "lexical";
import { JSDOM } from "jsdom";
import { ZettelDoc } from "@opral/zettel-ast";
import { fromLexicalState, toLexicalState } from "./parse-serialize.js";

beforeEach(() => {
  global.window = new JSDOM().window as unknown as Window & typeof globalThis;
});

test("handles new zettel.textBlock's", () => {
  const editor = createEditor({
    nodes: ZettelNodes,
  });

  registerZettelLexicalPlugin(editor);

  editor.update(
    () => {
      $getRoot().append(
        $createZettelTextBlockNode("block-0").append(
          $createZettelSpanNode("Hello world", "span-0"),
        ),
      );
    },
    // immediately apply change
    { discrete: true },
  );

  const state = editor.getEditorState().toJSON();
  const zettelDoc = fromLexicalState(state);

  expect(zettelDoc).toEqual([
    {
      _type: "zettel.textBlock",
      _key: "block-0",
      style: "zettel.normal",
      children: [
        {
          _type: "zettel.span",
          _key: "span-0",
          text: "Hello world",
          marks: [],
        },
      ],
      markDefs: [],
    },
  ]);
});

test("return key creates a new block", async () => {
  const editor = createEditor({
    nodes: ZettelNodes,
  });

  registerZettelLexicalPlugin(editor);

  const initialDoc: ZettelDoc = [
    {
      _type: "zettel.textBlock",
      _key: "block-0",
      style: "zettel.normal",
      children: [],
      markDefs: [],
    },
  ];

  editor.setEditorState(editor.parseEditorState(toLexicalState(initialDoc)));

  editor.update(
    () => {
      editor.dispatchCommand(KEY_ENTER_COMMAND, null);
    },
    { discrete: true },
  );

  const output = fromLexicalState(editor.getEditorState().toJSON());

  expect(output).toEqual([
    {
      _type: "zettel.textBlock",
      _key: "block-0",
      style: "zettel.normal",
      children: [],
      markDefs: [],
    },
    {
      _type: "zettel.textBlock",
      _key: expect.any(String),
      style: "zettel.normal",
      children: [],
      markDefs: [],
    },
  ]);
});
