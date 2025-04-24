import { test, expect } from "vitest";
import { toLexicalState, fromLexicalState } from "./parse-serialize.js";
import {
  ZettelDoc,
  createZettelSpan,
  createZettelTextBlock,
} from "@opral/zettel-ast";

test("handles an empty doc", () => {
  const doc: ZettelDoc = [];

  const lexicalState = toLexicalState(doc);

  expect(fromLexicalState(lexicalState)).toEqual(doc);
});

test("handles an empty text block", () => {
  const doc: ZettelDoc = [
    createZettelTextBlock({
      _key: "block-0",
      style: "zettel.normal",
      children: [],
      markDefs: [],
    }),
  ];

  const lexicalState = toLexicalState(doc);
  expect(fromLexicalState(lexicalState)).toEqual(doc);
});

test("handles a text block with a span", () => {
  const doc: ZettelDoc = [
    createZettelTextBlock({
      _key: "block-0",
      style: "zettel.normal",
      children: [
        createZettelSpan({
          _key: "span-0",
          text: "Hello world",
          marks: [],
        }),
      ],
      markDefs: [],
    }),
  ];

  const lexicalState = toLexicalState(doc);
  expect(fromLexicalState(lexicalState)).toEqual(doc);
});

test("handles span marks", () => {
  const doc: ZettelDoc = [
    createZettelTextBlock({
      _key: "block-0",
      style: "zettel.normal",
      children: [
        createZettelSpan({
          _key: "span-0",
          text: "Hello world",
          marks: ["zettel.strong", "zettel.em"],
        }),
      ],
      markDefs: [],
    }),
  ];

  const lexicalState = toLexicalState(doc);
  expect(fromLexicalState(lexicalState)).toEqual(doc);
});
