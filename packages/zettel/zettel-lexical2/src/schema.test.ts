import { test, expect } from "vitest";
import { validate } from "./validate.js";
import type { ZettelDoc } from "./schema.js";

test("link passes", async () => {
  const examplePortableText = [
    {
      _type: "zettel_text_block",
      _key: "4ee4134378b1",
      style: "zettel_normal",
      children: [
        {
          _type: "zettel_span",
          _key: "e60571e00344",
          text: "Have you seen ",
        },
        {
          _type: "zettel_span",
          _key: "c68e8030ad79",
          marks: [
            {
              _type: "zettel_link",
              _key: "6928e05a72cf",
              href: "https://example.com",
            },
          ],
          text: "this",
        },
        {
          _type: "zettel_span",
          _key: "2d3de5b05adc",
          text: "?",
        },
      ],
    },
  ];

  const result = validate(examplePortableText);
  expect(result.errors).toBeUndefined();
});

test("header h1 passes", async () => {
  const examplePortableText = [
    {
      _type: "zettel_text_block",
      _key: "4ee4134378b1",
      style: "zettel_h1",
      children: [
        {
          _type: "zettel_span",
          _key: "e60571e00344",
          text: "This is a header",
          marks: [],
        },
      ],
    },
  ];

  const result = validate(examplePortableText);
  expect(result.errors).toBeUndefined();
});

test("bold passes", async () => {
  const examplePortableText = [
    {
      _type: "zettel_text_block",
      _key: "4ee4134378b1",
      style: "zettel_normal",
      children: [
        {
          _type: "zettel_span",
          _key: "e60571e00344",
          text: "Hello world",
          marks: [
            {
              _type: "zettel_bold",
              _key: "j2j9js",
            },
          ],
        },
      ],
    },
  ];

  const result = validate(examplePortableText);
  expect(result.errors).toBeUndefined();
});

test("italic passes", async () => {
  const examplePortableText = [
    {
      _type: "zettel_text_block",
      _key: "4ee4134378b1",
      style: "zettel_normal",
      children: [
        {
          _type: "zettel_span",
          _key: "e60571e00344",
          text: "Hello world",
          marks: [
            {
              _type: "zettel_italic",
              _key: "4j-js9jg3",
            },
          ],
        },
      ],
    },
  ];

  const result = validate(examplePortableText);
  expect(result.errors).toBeUndefined();
});

test("should reject unknown 'zettel_' marks", () => {
  const doc: ZettelDoc = [
    {
      _type: "zettel_text_block",
      _key: "uniqueKey",
      markDefs: [],
      style: "normal",
      children: [
        {
          _type: "zettel_span",
          _key: "spanInvalid",
          text: "Invalid mark test",
          marks: ["zettel_ananas"],
        },
      ],
    },
  ];

  const result = validate(doc);
  expect(result.errors).not.toBeUndefined();
});

test("allows custom blocks", () => {
  const doc: ZettelDoc = [
    {
      _type: "custom_block",
      _key: "uniqueKey",
    },
  ];

  const result = validate(doc);
  expect(result.errors).toBeUndefined();
});

test.todo("adding custom marks", () => {
  const doc: ZettelDoc = [
    {
      _type: "zettel_text_block",
      _key: "uniqueKey",
      style: "normal",
      children: [
        {
          _type: "zettel_span",
          _key: "spanInvalid",
          text: "Invalid mark test",
          marks: [
            {
              _type: "custom_mark",
              _key: "uniqueKey",
            },
          ],
        },
      ],
    },
  ];

  const result = validate(doc);
  expect(result.errors).toBeUndefined();
});

test("custom blocks may not define keys with `_` prefix to avoid conflicts", () => {
  const doc: ZettelDoc = [
    {
      _type: "custom_block",
      _key: "_uniqueKey",
      _foo: {},
    },
  ];

  const result = validate(doc);
  expect(result.errors).toBeDefined();
});
