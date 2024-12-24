import { it, expect } from "vitest";
import { compileMessage } from "./compileMessage.js";
import type { Declaration, Message, Variant } from "@inlang/sdk";
import { DEFAULT_REGISTRY } from "./registry.js";

it("compiles a message with a single variant", async () => {
  const declarations: Declaration[] = [];
  const message: Message = {
    locale: "en",
    bundleId: "some_message",
    id: "message-id",
    selectors: [],
  };
  const variants: Variant[] = [
    {
      id: "1",
      messageId: "message-id",
      matches: [],
      pattern: [{ type: "text", value: "Hello" }],
    },
  ];

  const compiled = compileMessage(
    declarations,
    message,
    variants,
    DEFAULT_REGISTRY,
  );

  const { some_message } = await import(
    "data:text/javascript;base64," + btoa(compiled.code)
  );

  expect(some_message()).toBe("Hello");
});

it("compiles a message with variants", async () => {
  const declarations: Declaration[] = [
    { type: "input-variable", name: "fistInput" },
    { type: "input-variable", name: "secondInput" },
  ];

  const message: Message = {
    locale: "en",
    id: "some_message",
    bundleId: "some_message",
    selectors: [
      { type: "variable-reference", name: "fistInput" },
      { type: "variable-reference", name: "secondInput" },
    ],
  };

  const variants: Variant[] = [
    {
      id: "1",
      messageId: "some_message",
      matches: [
        { type: "literal-match", key: "fistInput", value: "1" },
        { type: "literal-match", key: "secondInput", value: "2" },
      ],
      pattern: [
        { type: "text", value: "The inputs are " },
        {
          type: "expression",
          arg: { type: "variable-reference", name: "fistInput" },
        },
        { type: "text", value: " and " },
        {
          type: "expression",
          arg: { type: "variable-reference", name: "secondInput" },
        },
      ],
    },
    {
      id: "2",
      messageId: "some_message",
      matches: [
        { type: "catchall-match", key: "fistInput" },
        { type: "catchall-match", key: "secondInput" },
      ],
      pattern: [{ type: "text", value: "Catch all" }],
    },
  ];

  const compiled = compileMessage(
    declarations,
    message,
    variants,
    DEFAULT_REGISTRY,
  );

  const { some_message } = await import(
    "data:text/javascript;base64," + btoa(compiled.code)
  );

  expect(some_message({ fistInput: 1, secondInput: 2 })).toBe(
    "The inputs are 1 and 2",
  );
  expect(some_message({ fistInput: 3, secondInput: 4 })).toBe("Catch all");
  expect(some_message({ fistInput: 1, secondInput: 5 })).toBe("Catch all");
});
