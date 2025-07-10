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
 * Defines a collection of test cases for the `renderHtmlDiff` function.
 * This array serves as a single source of truth for both unit tests (`*.test.ts`)
 * and potentially visual regression tests or viewers.
 */
export const testCases: TestCase[] = [
  {
    name: "should highlight added text within a paragraph",
    beforeHtml: dedent`
      <p data-diff-key="ksu4">Hello</p>
    `,
    afterHtml: dedent`
      <p data-diff-key="ksu4">Hello World</p>
    `,
    expectedHtml: dedent`
      <div>
        <p data-diff-key="ksu4" class="diff-before">Hello</p>
        <p data-diff-key="ksu4" class="diff-after">Hello World</p>
      </div>
    `,
  },
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
    name: "should highlight removed text within a paragraph",
    // Note: Escaped quotes needed within the template literal for the expectedHtml string
    beforeHtml: dedent`
      <p data-diff-key="rem">Remove This</p>
    `,
    afterHtml: dedent`
      <p data-diff-key="rem">Remove </p>
    `,
    expectedHtml: dedent`
      <div>
        <p data-diff-key="rem" class="diff-before">Remove This</p>
        <p data-diff-key="rem" class="diff-after">Remove </p>
      </div>
    `,
  },
  {
    name: "should highlight added element",
    // Note: Escaped quotes needed within the template literal for the expectedHtml string
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
        <p data-diff-key="p2" class="diff-after">New Para</p>
      </div>
    `,
  },
  {
    name: "should handle text changes with both additions and removals",
    // Note: Escaped quotes needed within the template literal for the expectedHtml string
    beforeHtml: dedent`
      <span data-diff-key="complex">Old text here</span>
    `,
    afterHtml: dedent`
      <span data-diff-key="complex">New text there</span>
    `,
    expectedHtml: dedent`
      <div>
        <span data-diff-key="complex" class="diff-before">Old text here</span>
        <span data-diff-key="complex" class="diff-after">New text there</span>
      </div>
    `,
  },
  {
    name: "should merge diff classes with existing classes",
    beforeHtml: dedent`
      <p data-diff-key="merge" class="foo bar">Old</p>
    `,
    afterHtml: dedent`
      <p data-diff-key="merge" class="foo bar">New</p>
    `,
    expectedHtml: dedent`
      <div>
        <p data-diff-key="merge" class="foo bar diff-before">Old</p>
        <p data-diff-key="merge" class="foo bar diff-after">New</p>
      </div>
    `,
  },
];
