/**
 * A collection of test cases for the renderHtmlDiff function.
 * Each test case includes a name, the HTML before the change, and the HTML after the change.
 */
import dedent from "dedent";

/**
 * Defines the structure of a single test case.
 */
export type TestCase = {
  name: string;
  beforeHtml: string;
  afterHtml: string;
  expectedHtml: string;
};

/**
 * Defines a collection of test cases organized by section for the `renderHtmlDiff` function.
 * This structure serves as a single source of truth for both unit tests (`*.test.ts`)
 * and the visual test cases viewer.
 */
export const testCasesBySection: Record<string, TestCase[]> = {
  "data-diff-key": [
    {
      name: "should return the same HTML element if no changes are made",
      beforeHtml: dedent`
        <p data-diff-key="abc">Test</p>
      `,
      afterHtml: dedent`
        <p data-diff-key="abc">Test</p>
      `,
      expectedHtml: dedent`
        <p data-diff-key="abc">Test</p>
      `,
    },
    {
      name: "should highlight added element",
      beforeHtml: dedent`
        <div>
          <p data-diff-key="p1">Para 1</p>
        </div>
      `,
      afterHtml: dedent`
        <div>
          <p data-diff-key="p1">Para 1</p>
          <p data-diff-key="p2">New Para</p>
        </div>
      `,
      expectedHtml: dedent`
        <div>
          <p data-diff-key="p1">Para 1</p>
          <p data-diff-key="p2" class="diff-create">New Para</p>
        </div>
      `,
    },
    {
      name: "should use atomic block diffing for complex components without data-diff-words",
      beforeHtml: dedent`
        <div class="tool-container" data-diff-key="complex-component">Old complex component</div>
      `,
      afterHtml: dedent`
        <div class="tool-container" data-diff-key="complex-component">New complex component</div>
      `,
      expectedHtml: dedent`
        <div class="tool-container diff-delete" data-diff-key="complex-component">Old complex component</div>
      `,
    },
  ],
  "data-diff-words": [
    {
      name: "should highlight added text within a paragraph",
      beforeHtml: dedent`
        <p data-diff-key="ksu4" data-diff-words>Hello</p>
      `,
      afterHtml: dedent`
        <p data-diff-key="ksu4" data-diff-words>Hello World</p>
      `,
      expectedHtml: dedent`
        <p data-diff-key="ksu4" data-diff-words="">Hello <span class="diff-create">World</span></p>
      `,
    },
    {
      name: "should highlight removed text within a paragraph",
      beforeHtml: dedent`
        <p data-diff-key="rem" data-diff-words>Remove This</p>
      `,
      afterHtml: dedent`
        <p data-diff-key="rem" data-diff-words>Remove </p>
      `,
      expectedHtml: dedent`
        <p data-diff-key="rem" data-diff-words="">Remove <span class="diff-delete">This</span></p>
      `,
    },
    {
      name: "should handle text changes with both additions and removals",
      beforeHtml: dedent`
        <span data-diff-key="complex" data-diff-words>Old text here</span>
      `,
      afterHtml: dedent`
        <span data-diff-key="complex" data-diff-words>New text there</span>
      `,
      expectedHtml: dedent`
        <span data-diff-key="complex" data-diff-words=""><span class="diff-delete">Old</span><span class="diff-create">New</span> text <span class="diff-delete">here</span><span class="diff-create">there</span></span>
      `,
    },
    {
      name: "should merge diff classes with existing classes",
      beforeHtml: dedent`
        <p data-diff-key="merge" class="foo bar" data-diff-words>Old</p>
      `,
      afterHtml: dedent`
        <p data-diff-key="merge" class="foo bar" data-diff-words>New</p>
      `,
      expectedHtml: dedent`
        <p data-diff-key="merge" class="foo bar" data-diff-words=""><span class="diff-delete">Old</span><span class="diff-create">New</span></p>
      `,
    },
  ],
};

// Flattened array for backward compatibility with existing tests
export const testCases: TestCase[] = [
  ...testCasesBySection["data-diff-key"]!,
  ...testCasesBySection["data-diff-words"]!,
];
