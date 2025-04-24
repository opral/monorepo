import { beforeEach, expect, test } from "vitest";
import { registerZettelLexicalPlugin } from "./plugin.js";
import {
  $createZettelSpanNode,
  $createZettelTextBlockNode,
  $isZettelSpanNode,
  ZettelNodes,
} from "./old/nodes.js";
import {
  $getRoot,
  $isParagraphNode,
  $isTextNode,
  createEditor,
  KEY_ENTER_COMMAND,
  PASTE_COMMAND,
  COPY_COMMAND,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import { JSDOM } from "jsdom";
import { ZettelDoc } from "@opral/zettel-ast";
import { fromLexicalState, toLexicalState } from "./old/parse-serialize.js";
import { toHtmlString, validateHtmlString } from "@opral/zettel-html";

beforeEach(() => {
  const dom = new JSDOM();
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.MutationObserver = dom.window.MutationObserver;
  // @ts-expect-error
  globalThis.window = dom.window;
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
      _key: expect.stringMatching(/^.+$/),
      style: "zettel.normal",
      children: [],
      markDefs: [],
    },
  ]);
});

test("pastes plain text as new zettel.textBlock", async () => {
  const editor = createEditor({
    nodes: ZettelNodes,
  });
  registerZettelLexicalPlugin(editor);

  // Simulate a plain text paste event
  const clipboardData = {
    types: ["text/plain"],
    getData: (type: string) =>
      type === "text/plain" ? "Hello clipboard!" : "",
  };
  const event = { clipboardData } as unknown as ClipboardEvent;

  // Fire the paste command
  editor.update(
    () => {
      editor.dispatchCommand(PASTE_COMMAND, event);
    },
    { discrete: true },
  );

  // Check that a new block was inserted with the text
  const state = editor.getEditorState().toJSON();
  const zettelDoc = fromLexicalState(state);
  expect(zettelDoc).toEqual([
    {
      _type: "zettel.textBlock",
      _key: expect.stringMatching(/^.+$/),
      style: "zettel.normal",
      children: [
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: "Hello clipboard!",
          marks: [],
        },
      ],
      markDefs: [],
    },
  ]);
});

test("pastes a zettel HTML document", async () => {
  const editor = createEditor({
    nodes: ZettelNodes,
  });
  registerZettelLexicalPlugin(editor);

  // Create a ZettelDoc and serialize to HTML
  const zettelDoc = [
    {
      _type: "zettel.textBlock",
      _key: "block-0",
      style: "zettel.normal",
      children: [
        {
          _type: "zettel.span",
          _key: "span-0",
          text: "HTML paste!",
          marks: [],
        },
      ],
      markDefs: [],
    },
  ];
  // Use the same toHtml function as the plugin
  const zettelHtml = toHtmlString(zettelDoc);

  // Simulate a Zettel HTML paste event
  const clipboardData = {
    types: ["text/html"],
    getData: (type: string) => (type === "text/html" ? zettelHtml : ""),
  };
  const event = { clipboardData } as unknown as ClipboardEvent;

  // Fire the paste command
  editor.update(
    () => {
      editor.dispatchCommand(PASTE_COMMAND, event);
    },
    { discrete: true },
  );

  // Check that the AST was restored
  const state = editor.getEditorState().toJSON();
  const restored = fromLexicalState(state);
  expect(restored).toEqual([
    {
      _type: "zettel.textBlock",
      _key: expect.stringMatching(/^.+$/),
      style: "zettel.normal",
      children: [
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: "HTML paste!",
          marks: [],
        },
      ],
      markDefs: [],
    },
  ]);
});

test("pastes a generic HTML document (not zettel) and parses as fallback", () => {
  const editor = createEditor({
    nodes: ZettelNodes,
  });

  registerZettelLexicalPlugin(editor);

  // Simulate a generic HTML paste event (not zettel HTML)
  const genericHtml = `<p>This is <strong>bold</strong> and <em>italic</em> text.</p><p>Second paragraph.</p>`;
  const clipboardData = {
    types: ["text/html"],
    getData: (type: string) => (type === "text/html" ? genericHtml : ""),
  };
  const event = { clipboardData } as unknown as ClipboardEvent;

  // Fire the paste command
  editor.update(
    () => {
      editor.dispatchCommand(PASTE_COMMAND, event);
    },
    { discrete: true },
  );

  // Check that the AST was restored as fallback
  const state = editor.getEditorState().toJSON();
  const restored = fromLexicalState(state);
  expect(restored).toEqual([
    {
      _type: "zettel.textBlock",
      _key: expect.stringMatching(/^.+$/),
      style: "zettel.normal",
      children: [
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: "This is ",
          marks: [],
        },
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: "bold",
          marks: ["zettel.strong"],
        },
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: " and ",
          marks: [],
        },
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: "italic",
          marks: ["zettel.em"],
        },
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: " text.",
          marks: [],
        },
      ],
      markDefs: [],
    },
    {
      _type: "zettel.textBlock",
      _key: expect.stringMatching(/^.+$/),
      style: "zettel.normal",
      children: [
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: "Second paragraph.",
          marks: [],
        },
      ],
      markDefs: [],
    },
  ]);
});

test("copies zettel as plain text, HTML, and zettel doc", () => {
  const editor = createEditor({ nodes: ZettelNodes });
  registerZettelLexicalPlugin(editor);

  // Set up initial Zettel AST in the editor
  const zettelDoc = [
    {
      _type: "zettel.textBlock",
      _key: "block1",
      style: "zettel.normal",
      children: [
        { _type: "zettel.span", _key: "span1", text: "Hello ", marks: [] },
        {
          _type: "zettel.span",
          _key: "span2",
          text: "world",
          marks: ["zettel.strong"],
        },
      ],
      markDefs: [],
    },
  ];
  editor.setEditorState(editor.parseEditorState(toLexicalState(zettelDoc)));

  // Mock clipboard
  let clipboardData: Record<string, string> = {};
  const clipboardEvent = {
    clipboardData: {
      setData: (type: string, value: string) => {
        clipboardData[type] = value;
      },
      getData: (type: string) => clipboardData[type],
    },
    preventDefault: () => {},
  } as unknown as ClipboardEvent;

  // Fire the copy command
  editor.update(
    () => {
      editor.dispatchCommand(COPY_COMMAND, clipboardEvent);
    },
    { discrete: true },
  );

  // Check clipboard contents
  expect(clipboardData["text/plain"]).toBe("Hello world");
  expect(clipboardData["text/html"]).toContain("data-zettel-doc");
  expect(clipboardData["text/html"]).toContain("<strong>world</strong>");
  expect(clipboardData["text/zettel"]).toBeDefined();
  expect(() => JSON.parse(clipboardData["text/zettel"])).not.toThrow();
  expect(JSON.parse(clipboardData["text/zettel"])).toEqual([
    {
      _type: "zettel.textBlock",
      _key: "block1",
      style: "zettel.normal",
      children: [
        { _type: "zettel.span", _key: "span1", text: "Hello ", marks: [] },
        {
          _type: "zettel.span",
          _key: "span2",
          text: "world",
          marks: ["zettel.strong"],
        },
      ],
      markDefs: [],
    },
  ]);
});

test.todo("copies only the selected text and marks", () => {
  const editor = createEditor({ nodes: ZettelNodes });
  registerZettelLexicalPlugin(editor);

  // Set up initial Zettel AST in the editor
  const zettelDoc = [
    {
      _type: "zettel.textBlock",
      _key: "block1",
      style: "zettel.normal",
      children: [
        { _type: "zettel.span", _key: "span1", text: "Hello ", marks: [] },
        {
          _type: "zettel.span",
          _key: "span2",
          text: "world",
          marks: ["zettel.strong"],
        },
        { _type: "zettel.span", _key: "span3", text: "!", marks: [] },
      ],
      markDefs: [],
    },
  ];
  const lexicalState = toLexicalState(zettelDoc);
  editor.setEditorState(editor.parseEditorState(lexicalState));

  // Select only "world"
  editor.update(() => {
    const root = $getRoot();
    const first = root.getFirstChild();
    if (first && $isParagraphNode(first)) {
      const spanNodes = first.getChildren();
      // Select the second span ("world")
      if (spanNodes.length > 1 && $isTextNode(spanNodes[1])) {
        spanNodes[1].select(0, spanNodes[1].getTextContentSize());
      }
    }
  });

  // Mock clipboard
  let clipboardData: Record<string, string> = {};
  const clipboardEvent = {
    clipboardData: {
      setData: (type: string, value: string) => {
        clipboardData[type] = value;
      },
      getData: (type: string) => clipboardData[type],
    },
    preventDefault: () => {},
  } as unknown as ClipboardEvent;

  // Fire the copy command
  editor.update(() => {
    editor.dispatchCommand(COPY_COMMAND, clipboardEvent);
  });

  expect(JSON.parse(clipboardData["text/zettel"])).toEqual([
    {
      _type: "zettel.textBlock",
      _key: expect.stringMatching(/^.+$/),
      style: "zettel.normal",
      children: [
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: "world",
          marks: ["zettel.strong"],
        },
      ],
      markDefs: [],
    },
  ]);
});

test("toggling italic splits and merges spans and updates marks correctly", () => {
  const editor = createEditor({ nodes: ZettelNodes });
  registerZettelLexicalPlugin(editor);

  // Set the initial Zettel AST doc and state
  const initialDoc = [
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
  ];
  editor.setEditorState(editor.parseEditorState(toLexicalState(initialDoc)));

  // Select "world" and toggle italic
  editor.update(
    () => {
      const root = $getRoot();
      const block = root.getFirstChild();
      if (block && $isParagraphNode(block)) {
        const span = block.getFirstChild();
        if (span && $isZettelSpanNode(span)) {
          // "Hello ".length === 6
          span.select(6, 11);
        }
      }
    },
    { discrete: true },
  );

  editor.update(
    () => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    },
    { discrete: true },
  );

  // Get the resulting Zettel AST after italic
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
          text: "Hello ",
          marks: [],
        },
        {
          _type: "zettel.span",
          _key: expect.stringMatching(/^.+$/),
          text: "world",
          marks: ["zettel.em"],
        },
      ],
      markDefs: [],
    },
  ]);

  // Now select "world" again and toggle italic OFF
  editor.update(
    () => {
      const root = $getRoot();
      const block = root.getFirstChild();
      if (block && $isParagraphNode(block)) {
        // After split, "world" should be the second child
        const span = block.getChildAtIndex(1);
        if (span && $isZettelSpanNode(span)) {
          span.select(0, 5); // Select all of "world"
        }
      }
    },
    { discrete: true },
  );
  editor.update(
    () => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    },
    { discrete: true },
  );

  // Get the resulting Zettel AST after toggling italic OFF
  const state2 = editor.getEditorState().toJSON();
  const zettelDoc2 = fromLexicalState(state2);

  expect(zettelDoc2).toEqual(initialDoc);
});

test("renders valid zettel html", async () => {
  const editor = createEditor({ nodes: ZettelNodes });

  const element = document.createElement("div");
  element.setAttribute("contenteditable", "");
  element.setAttribute("data-zettel-doc", "true");

  registerZettelLexicalPlugin(editor);

  const zettelDoc: ZettelDoc = [
    {
      _type: "zettel.textBlock",
      _key: "block-0",
      style: "zettel.normal",
      children: [
        {
          _type: "zettel.span",
          _key: "span-0",
          text: "Hello world",
          marks: ["zettel.strong", "zettel.em"],
        },
        {
          _type: "zettel.span",
          _key: "span-1",
          text: "look at this link",
          marks: ["link-0"],
        },
      ],
      markDefs: [
        {
          _type: "zettel.link",
          _key: "link-0",
          href: "https://example.com",
        },
      ],
    },
  ];

  editor.setEditorState(editor.parseEditorState(toLexicalState(zettelDoc)));

  editor.setRootElement(element);

  const result = validateHtmlString(element.outerHTML);

  expect(result).toEqual({
    success: true,
    data: expect.anything(),
  });
});