import { describe, it, expect } from "vitest";
// import { parseLixUri, parseOrigin } from "./helpers.js"
import { normalizeMessage, stringifyMessage } from "./helper.js";
import type { Message } from "@inlang/message";

const unsortedMessageRaw: Message = {
  alias: {},
  selectors: [],
  id: "footer_categories_apps",
  variants: [
    {
      languageTag: "a",
      match: ["*", "1"],
      pattern: [{ type: "Text", value: "2" }],
    },
    {
      languageTag: "a",
      match: ["*", "*"],
      pattern: [{ type: "Text", value: "1" }],
    },
    {
      languageTag: "a",
      match: ["1", "*"],
      pattern: [
        { type: "Text", value: "2" },
        { type: "Text", value: "2" },
      ],
    },
    { languageTag: "b", match: [], pattern: [{ type: "Text", value: "4" }] },
    {
      languageTag: "a",
      match: ["1", "1"],
      pattern: [{ type: "Text", value: "2" }],
    },
    { languageTag: "c", match: [], pattern: [{ value: "5", type: "Text" }] },
    { match: [], languageTag: "d", pattern: [{ type: "Text", value: "6" }] },
    { languageTag: "e", match: [], pattern: [{ type: "Text", value: "7" }] },
    { languageTag: "f", match: [], pattern: [{ type: "Text", value: "8" }] },
    { languageTag: "g", match: [], pattern: [{ type: "Text", value: "9" }] },
  ],
};

const sortedMessageRaw: Message = {
  alias: {},
  id: "footer_categories_apps",
  selectors: [],
  variants: [
    {
      languageTag: "a",
      match: ["*", "*"],
      pattern: [{ type: "Text", value: "1" }],
    },
    {
      languageTag: "a",
      match: ["*", "1"],
      pattern: [{ type: "Text", value: "2" }],
    },
    {
      languageTag: "a",
      match: ["1", "*"],
      pattern: [
        { type: "Text", value: "2" },
        { type: "Text", value: "2" },
      ],
    },
    {
      languageTag: "a",
      match: ["1", "1"],
      pattern: [{ type: "Text", value: "2" }],
    },
    { languageTag: "b", match: [], pattern: [{ type: "Text", value: "4" }] },
    { languageTag: "c", match: [], pattern: [{ type: "Text", value: "5" }] },
    { languageTag: "d", match: [], pattern: [{ type: "Text", value: "6" }] },
    { languageTag: "e", match: [], pattern: [{ type: "Text", value: "7" }] },
    { languageTag: "f", match: [], pattern: [{ type: "Text", value: "8" }] },
    { languageTag: "g", match: [], pattern: [{ type: "Text", value: "9" }] },
  ],
};

// stringify with no indentation
function str(obj: any) {
  return JSON.stringify(obj);
}

// stringify with 2 space indentation
function str2(obj: any) {
  return JSON.stringify(obj, undefined, 2);
}

// stringify with 4 space indentation
function str4(obj: any) {
  return JSON.stringify(obj, undefined, 4);
}

describe("normalizeMessage", () => {
  it("should return the message with sorted keys and variants", () => {
    // test cases are not the same (deep equal) before normalization
    // array order of variants is different
    expect(unsortedMessageRaw).not.toEqual(sortedMessageRaw);

    // test cases are the same after normalization
    expect(normalizeMessage(unsortedMessageRaw)).toEqual(sortedMessageRaw);

    // stringify results are not the same before normalization
    expect(str(unsortedMessageRaw)).not.toBe(str(sortedMessageRaw));

    // stringify results are the same after normalization
    expect(str(normalizeMessage(unsortedMessageRaw))).toBe(
      str(sortedMessageRaw),
    );
    expect(str2(normalizeMessage(unsortedMessageRaw))).toBe(
      str2(sortedMessageRaw),
    );
    expect(str4(normalizeMessage(unsortedMessageRaw))).toBe(
      str4(sortedMessageRaw),
    );
  });
});

describe("stringifyMessage", () => {
  it("should normalize and JSON stringify a message with 4 space indentation", () => {
    expect(stringifyMessage(unsortedMessageRaw)).toBe(str4(sortedMessageRaw));
    expect(stringifyMessage(sortedMessageRaw)).toBe(str4(sortedMessageRaw));
  });
});
