/**
 * A collection of test cases for the renderUniversalDiff function.
 * Each test case includes a name, the HTML before the change, and the HTML after the change.
 */

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
    beforeHtml: `<p data-lix-entity-id="ksu4">Hello</p>`,
    afterHtml: `<p data-lix-entity-id="ksu4">Hello World</p>`,
    expectedHtml: `<p data-lix-entity-id="ksu4">Hello<span style="background-color: lightgreen;"> World</span></p>`,
  },
  {
    name: "should return the same HTML element if no changes are made",
    beforeHtml: `<p data-lix-entity-id="abc">Test</p>`,
    afterHtml: `<p data-lix-entity-id="abc">Test</p>`,
    expectedHtml: `<p data-lix-entity-id="abc">Test</p>`,
  },
  {
    name: "should highlight removed text within a paragraph",
    // Note: Escaped quotes needed within the template literal for the expectedHtml string
    beforeHtml: `<p data-lix-entity-id="rem">Remove This</p>`,
    afterHtml: `<p data-lix-entity-id="rem">Remove </p>`,
    expectedHtml: `<p data-lix-entity-id="rem">Remove <span style="background-color: lightcoral; text-decoration: line-through;">This</span></p>`,
  },
  {
    name: "should highlight added element",
    // Note: Escaped quotes needed within the template literal for the expectedHtml string
    beforeHtml: `<div><p data-lix-entity-id="p1">Para 1</p></div>`,
    afterHtml: `<div><p data-lix-entity-id="p1">Para 1</p><p data-lix-entity-id="p2" style="outline: 2px solid lightblue;">New Para</p></div>`,
    expectedHtml: `<div><p data-lix-entity-id="p1">Para 1</p><p data-lix-entity-id="p2" style="outline: 2px solid lightblue;">New Para</p></div>`,
  },
  {
    name: "should handle text changes with both additions and removals",
    // Note: Escaped quotes needed within the template literal for the expectedHtml string
    beforeHtml: `<span data-lix-entity-id="complex">Old text here</span>`,
    afterHtml: `<span data-lix-entity-id="complex">New text there</span>`,
    expectedHtml: `<span data-lix-entity-id="complex"><span style="background-color: lightcoral; text-decoration: line-through;">Old</span><span style="background-color: lightgreen;">New</span> text <span style="background-color: lightcoral; text-decoration: line-through;">here</span><span style="background-color: lightgreen;">there</span></span>`,
  },
  // Add more test cases here as needed
];
