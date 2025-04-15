/**
 * A collection of test cases for the renderUniversalDiff function.
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
 * Defines a collection of test cases for the `renderUniversalDiff` function.
 * This array serves as a single source of truth for both unit tests (`*.test.ts`)
 * and potentially visual regression tests or viewers.
 */
export const testCases: TestCase[] = [
  {
    name: "should highlight added text within a paragraph",
    beforeHtml: dedent`
      <p data-diff-id="ksu4">Hello</p>
    `,
    afterHtml: dedent`
      <p data-diff-id="ksu4">Hello World</p>
    `,
    expectedHtml: dedent`
      <p data-diff-id="ksu4">Hello<span style="background-color: lightgreen;"> World</span></p>
    `,
  },
  {
    name: "should return the same HTML element if no changes are made",
    beforeHtml: dedent`
      <p data-diff-id="abc">Test</p>
    `,
    afterHtml: dedent`
      <p data-diff-id="abc">Test</p>
    `,
    expectedHtml: dedent`
      <p data-diff-id="abc">Test</p>
    `,
  },
  {
    name: "should highlight removed text within a paragraph",
    // Note: Escaped quotes needed within the template literal for the expectedHtml string
    beforeHtml: dedent`
      <p data-diff-id="rem">Remove This</p>
    `,
    afterHtml: dedent`
      <p data-diff-id="rem">Remove </p>
    `,
    expectedHtml: dedent`
      <p data-diff-id="rem">Remove <span style="background-color: lightcoral; text-decoration: line-through;">This</span></p>
    `,
  },
  {
    name: "should highlight added element",
    // Note: Escaped quotes needed within the template literal for the expectedHtml string
    beforeHtml: dedent`
      <div>
        <p data-diff-id="p1">Para 1</p>
      </div>
    `,
    afterHtml: dedent`
      <div>
        <p data-diff-id="p1">Para 1</p>
        <p data-diff-id="p2">New Para</p>
      </div>
    `,
    expectedHtml: dedent`
      <div>
        <p data-diff-id="p1">Para 1</p>
        <p data-diff-id="p2">New Para</p>
      </div>
    `,
  },
  {
    name: "should handle text changes with both additions and removals",
    // Note: Escaped quotes needed within the template literal for the expectedHtml string
    beforeHtml: dedent`
      <span data-diff-id="complex">Old text here</span>
    `,
    afterHtml: dedent`
      <span data-diff-id="complex">New text there</span>
    `,
    expectedHtml: dedent`
      <span data-diff-id="complex">
        <span style="background-color: lightcoral; text-decoration: line-through;">Old</span>
        <span style="background-color: lightgreen;">New</span> text 
        <span style="background-color: lightcoral; text-decoration: line-through;">here</span>
        <span style="background-color: lightgreen;">there</span>
      </span>
    `,
  },
];
