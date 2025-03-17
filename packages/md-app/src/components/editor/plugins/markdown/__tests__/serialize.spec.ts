import { describe, it, expect } from "vitest";
import { createTestEditor, serializeToMarkdown, normalizeMarkdown } from "./test-helpers";
import { Descendant } from "@udecode/plate";

describe("Markdown Plugin Serialization Tests", () => {
  const editor = createTestEditor();

  it("should serialize headings", () => {
    const editorValue: Descendant[] = [
      {
        type: "h1",
        children: [{ text: "Heading 1" }],
      },
      {
        type: "h2",
        children: [{ text: "Heading 2" }],
      },
      {
        type: "h3",
        children: [{ text: "Heading 3" }],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "# Heading 1\n\n## Heading 2\n\n### Heading 3";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize paragraphs", () => {
    const editorValue: Descendant[] = [
      {
        type: "p",
        children: [{ text: "This is paragraph 1." }],
      },
      {
        type: "p",
        children: [{ text: "This is paragraph 2." }],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "This is paragraph 1.\n\nThis is paragraph 2.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize text formatting", () => {
    const editorValue: Descendant[] = [
      {
        type: "p",
        children: [
          { text: "This has " },
          { text: "bold", bold: true },
          { text: " and " },
          { text: "italic", italic: true },
          { text: " and " },
          { text: "strikethrough", strikethrough: true },
          { text: " formatting." },
        ],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "This has **bold** and *italic* and ~~strikethrough~~ formatting.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize links", () => {
    const editorValue: Descendant[] = [
      {
        type: "p",
        children: [
          { text: "This is a " },
          {
            type: "a",
            url: "https://example.com",
            children: [{ text: "link" }],
          },
          { text: " in text." },
        ],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "This is a [link](https://example.com) in text.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize blockquotes", () => {
    const editorValue: Descendant[] = [
      {
        type: "blockquote",
        children: [{ text: "This is a blockquote." }],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "> This is a blockquote.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize unordered lists", () => {
    const editorValue: Descendant[] = [
      {
        type: "ul",
        children: [
          {
            type: "li",
            children: [
              {
                type: "lic",
                children: [{ text: "Item 1" }],
              },
            ],
          },
          {
            type: "li",
            children: [
              {
                type: "lic",
                children: [{ text: "Item 2" }],
              },
            ],
          },
        ],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "- Item 1\n- Item 2";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize ordered lists", () => {
    const editorValue: Descendant[] = [
      {
        type: "ol",
        children: [
          {
            type: "li",
            children: [
              {
                type: "lic",
                children: [{ text: "Item 1" }],
              },
            ],
          },
          {
            type: "li",
            children: [
              {
                type: "lic",
                children: [{ text: "Item 2" }],
              },
            ],
          },
        ],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "1. Item 1\n2. Item 2";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize code blocks", () => {
    const editorValue: Descendant[] = [
      {
        type: "code_block",
        lang: "javascript",
        children: [
          {
            type: "code_line",
            children: [{ text: "const x = 1;" }],
          },
          {
            type: "code_line",
            children: [{ text: "console.log(x);" }],
          },
        ],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "```javascript\nconst x = 1;\nconsole.log(x);\n```";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize inline code", () => {
    const editorValue: Descendant[] = [
      {
        type: "p",
        children: [
          { text: "This is " },
          { text: "inline code", code: true },
          { text: " in text." },
        ],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "This is `inline code` in text.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize horizontal rules", () => {
    const editorValue: Descendant[] = [
      {
        type: "p",
        children: [{ text: "Text before rule" }],
      },
      {
        type: "hr",
        children: [{ text: "" }],
      },
      {
        type: "p",
        children: [{ text: "Text after rule" }],
      },
    ];

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "Text before rule\n\n---\n\nText after rule";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });
});