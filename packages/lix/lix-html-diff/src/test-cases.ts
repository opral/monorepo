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
          <p data-diff-key="p2" class="diff-created">New Para</p>
        </div>
      `,
    },
    {
      name: "should mark changed element as updated without data-diff-mode",
      beforeHtml: dedent`
        <div class="tool-container" data-diff-key="complex-component">Old complex component</div>
      `,
      afterHtml: dedent`
        <div class="tool-container" data-diff-key="complex-component">New complex component</div>
      `,
      expectedHtml: dedent`
        <div class="diff-updated tool-container" data-diff-key="complex-component">New complex component</div>
      `,
    },
  ],
  "data-diff-mode='element'": [
    {
      name: "should use atomic element diffing when data-diff-mode=\"element\" is specified",
      beforeHtml: dedent`
        <div class="card" data-diff-key="complex" data-diff-mode="element">Old content here</div>
      `,
      afterHtml: dedent`
        <div class="card" data-diff-key="complex" data-diff-mode="element">New content here</div>
      `,
      expectedHtml: dedent`
        <div class="diff-deleted card" data-diff-key="complex" data-diff-mode="element" contenteditable="false">Old content here</div><div class="diff-created card" data-diff-key="complex" data-diff-mode="element">New content here</div>
      `,
    },
    {
      name: "should handle element diffing with existing classes",
      beforeHtml: dedent`
        <p class="highlight important" data-diff-key="text" data-diff-mode="element">Before text</p>
      `,
      afterHtml: dedent`
        <p class="highlight important" data-diff-key="text" data-diff-mode="element">After text</p>
      `,
      expectedHtml: dedent`
        <p class="diff-deleted highlight important" data-diff-key="text" data-diff-mode="element" contenteditable="false">Before text</p><p class="diff-created highlight important" data-diff-key="text" data-diff-mode="element">After text</p>
      `,
    },
  ],
  "data-diff-mode='words'": [
    {
      name: "should highlight added text within a paragraph",
      beforeHtml: dedent`
        <p data-diff-key="ksu4" data-diff-mode="words">Hello</p>
      `,
      afterHtml: dedent`
        <p data-diff-key="ksu4" data-diff-mode="words">Hello World</p>
      `,
      expectedHtml: dedent`
        <p data-diff-key="ksu4" data-diff-mode="words">Hello <span class="diff-created">World</span></p>
      `,
    },
    {
      name: "should highlight removed text within a paragraph",
      beforeHtml: dedent`
        <p data-diff-key="rem" data-diff-mode="words">Remove This</p>
      `,
      afterHtml: dedent`
        <p data-diff-key="rem" data-diff-mode="words">Remove </p>
      `,
      expectedHtml: dedent`
        <p data-diff-key="rem" data-diff-mode="words">Remove <span class="diff-deleted">This</span></p>
      `,
    },
    {
      name: "should handle text changes with both additions and removals",
      beforeHtml: dedent`
        <span data-diff-key="complex" data-diff-mode="words">Old text here</span>
      `,
      afterHtml: dedent`
        <span data-diff-key="complex" data-diff-mode="words">New text there</span>
      `,
      expectedHtml: dedent`
        <span data-diff-key="complex" data-diff-mode="words"><span class="diff-deleted">Old</span><span class="diff-created">New</span> text <span class="diff-deleted">here</span><span class="diff-created">there</span></span>
      `,
    },
    {
      name: "should merge diff classes with existing classes",
      beforeHtml: dedent`
        <p data-diff-key="merge" class="foo bar" data-diff-mode="words">Old</p>
      `,
      afterHtml: dedent`
        <p data-diff-key="merge" class="foo bar" data-diff-mode="words">New</p>
      `,
      expectedHtml: dedent`
        <p data-diff-key="merge" class="foo bar" data-diff-mode="words"><span class="diff-deleted">Old</span><span class="diff-created">New</span></p>
      `,
    },
  ],
  "data-diff-show-when-deleted": [
    {
      name: "should insert deleted element when it has data-diff-show-when-deleted",
      beforeHtml: dedent`
        <ul data-diff-key="list">
          <li data-diff-key="item1">First item</li>
          <li data-diff-key="item2" data-diff-show-when-deleted>Second item</li>
          <li data-diff-key="item3">Third item</li>
        </ul>
      `,
      afterHtml: dedent`
        <ul data-diff-key="list">
          <li data-diff-key="item1">First item</li>
          <li data-diff-key="item3">Third item</li>
        </ul>
      `,
      expectedHtml: dedent`
        <ul data-diff-key="list">
          <li data-diff-key="item1">First item</li>
          <li data-diff-key="item2" data-diff-show-when-deleted class="diff-deleted" contenteditable="false">Second item</li>
          <li data-diff-key="item3">Third item</li>
        </ul>
      `,
    },
    {
      name: "should NOT insert deleted element when it lacks data-diff-show-when-deleted",
      beforeHtml: dedent`
        <ul data-diff-key="list">
          <li data-diff-key="item1">First item</li>
          <li data-diff-key="item2">Second item</li>
          <li data-diff-key="item3">Third item</li>
        </ul>
      `,
      afterHtml: dedent`
        <ul data-diff-key="list">
          <li data-diff-key="item1">First item</li>
          <li data-diff-key="item3">Third item</li>
        </ul>
      `,
      expectedHtml: dedent`
        <ul data-diff-key="list">
          <li data-diff-key="item1">First item</li>
          <li data-diff-key="item3">Third item</li>
        </ul>
      `,
    },
    {
      name: "should handle mixed scenarios - some elements show when deleted, others don't",
      beforeHtml: dedent`
        <table>
          <tbody data-diff-key="table-body">
            <tr data-diff-key="row1" data-diff-show-when-deleted>
              <td>Safe row</td>
            </tr>
            <tr data-diff-key="row2">
              <td>Unsafe row</td>
            </tr>
            <tr data-diff-key="row3" data-diff-show-when-deleted>
              <td>Another safe row</td>
            </tr>
          </tbody>
        </table>
      `,
      afterHtml: dedent`
        <table>
          <tbody data-diff-key="table-body">
          </tbody>
        </table>
      `,
      expectedHtml: dedent`
        <table>
          <tbody data-diff-key="table-body">
            <tr data-diff-key="row1" data-diff-show-when-deleted class="diff-deleted" contenteditable="false">
              <td>Safe row</td>
            </tr>
            <tr data-diff-key="row3" data-diff-show-when-deleted class="diff-deleted" contenteditable="false">
              <td>Another safe row</td>
            </tr>
          </tbody>
        </table>
      `,
    },
  ],
};

// Flattened array for backward compatibility with existing tests
export const testCases: TestCase[] = [
  ...testCasesBySection["data-diff-key"]!,
  ...testCasesBySection["data-diff-mode='element'"]!,
  ...testCasesBySection["data-diff-mode='words'"]!,
  ...testCasesBySection["data-diff-show-when-deleted"]!,
];
