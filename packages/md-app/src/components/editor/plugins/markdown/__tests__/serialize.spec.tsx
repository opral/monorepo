/** @jsx jsxt */

import { describe, it, expect } from "vitest";
import { createTestEditor, serializeToMarkdown, normalizeMarkdown } from "./test-helpers";
import { jsxt } from '@udecode/plate-test-utils';

// This is necessary for JSX to work
jsxt;

describe("Markdown Plugin Serialization Tests", () => {
  const editor = createTestEditor();

  it("should serialize headings", () => {
    const editorValue = (
      <fragment>
        <hh1>Heading 1</hh1>
        <hh2>Heading 2</hh2>
        <hh3>Heading 3</hh3>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "# Heading 1\n\n## Heading 2\n\n### Heading 3";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize paragraphs", () => {
    const editorValue = (
      <fragment>
        <hp>This is paragraph 1.</hp>
        <hp>This is paragraph 2.</hp>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "This is paragraph 1.\n\nThis is paragraph 2.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize text formatting", () => {
    const editorValue = (
      <fragment>
        <hp>
          This has <htext bold>bold</htext> and <htext italic>italic</htext> and <htext strikethrough>strikethrough</htext> formatting.
        </hp>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "This has **bold** and *italic* and ~~strikethrough~~ formatting.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize links", () => {
    const editorValue = (
      <fragment>
        <hp>
          This is a <ha url="https://example.com">link</ha> in text.
        </hp>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "This is a [link](https://example.com) in text.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize blockquotes", () => {
    const editorValue = (
      <fragment>
        <hblockquote>This is a blockquote.</hblockquote>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "> This is a blockquote.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize unordered lists", () => {
    const editorValue = (
      <fragment>
        <hul>
          <hli>
            <hlic>Item 1</hlic>
          </hli>
          <hli>
            <hlic>Item 2</hlic>
          </hli>
        </hul>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "- Item 1\n- Item 2";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize ordered lists", () => {
    const editorValue = (
      <fragment>
        <hol>
          <hli>
            <hlic>Item 1</hlic>
          </hli>
          <hli>
            <hlic>Item 2</hlic>
          </hli>
        </hol>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "1. Item 1\n2. Item 2";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize code blocks", () => {
    const editorValue = (
      <fragment>
        <hcodeblock lang="javascript">
          <hcodeline>const x = 1;</hcodeline>
          <hcodeline>console.log(x);</hcodeline>
        </hcodeblock>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "```javascript\nconst x = 1;\nconsole.log(x);\n```";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize inline code", () => {
    const editorValue = (
      <fragment>
        <hp>
          This is <htext code>inline code</htext> in text.
        </hp>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "This is `inline code` in text.";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });

  it("should serialize horizontal rules", () => {
    const editorValue = (
      <fragment>
        <hp>Text before rule</hp>
        <element type="hr">
          <htext />
        </element>
        <hp>Text after rule</hp>
      </fragment>
    );

    const result = serializeToMarkdown(editor, editorValue);
    const expected = "Text before rule\n\n---\n\nText after rule";

    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(expected));
  });
});