import { describe, it, expect } from "vitest";
import {
  _serializeICU1Message as serializeICU1Message,
  serializeMessage,
} from "./serialize.js";
import { createMessage } from "./parse.js";
import { parse as parseICU1 } from "@formatjs/icu-messageformat-parser";
// this test-suite trusts that `createMessage` works correctly

describe("serializeMessage", () => {
  it("serializes a message with a single variant", () => {
    const msg = createMessage({
      messageSource: "Hello {name}!",
      bundleId: "sad_elephant",
      locale: "en",
    });

    const serialized = serializeMessage(msg);
    expect(serialized).toBe("Hello {name}!");
  });

  it("serializes a message with a select (no other)", () => {
    const msg = createMessage({
      messageSource:
        "It's, {season, select, spring {spring} summer {summer} fall {fall} winter {winter}}",
      bundleId: "sad_elephant",
      locale: "en",
    });

    const serialized = serializeMessage(msg);
    expect(serialized).toMatchInlineSnapshot(
      '"It\'s, {season, select, spring {spring} summer {summer} fall {fall} winter {winter}}"',
    );
  });

  it("serializes a message with a select (with other)", () => {
    const msg = createMessage({
      messageSource:
        "It's, {season, select, spring {spring} summer {summer} fall {fall} other {winter}}",
      bundleId: "sad_elephant",
      locale: "en",
    });
    const serialized = serializeMessage(msg);
    expect(serialized).toMatchInlineSnapshot(
      '"It\'s, {season, select, spring {spring} summer {summer} fall {fall} other {winter}}"',
    );
  });

  it("serializes a message with a plural", () => {
    const msg = createMessage({
      messageSource:
        "You have {likes, plural, =0 {No Likes} one {One Like} other {# Likes}}!",
      bundleId: "sad_elephant",
      locale: "en",
    });

    const serialized = serializeMessage(msg);
    expect(serialized).toMatchInlineSnapshot(
      '"You have {likes, select, 0 {No Likes} other {{likes, plural, one {One Like} other {{likes} Likes}}}}!"',
    );
  });
});

describe("serializeICU1Message", () => {
  it("serializes text", () => {
    const ast = parseICU1("Hello, {name}!");
    expect(serializeICU1Message(ast)).toBe("Hello, {name}!");
  });

  it("serializes select", () => {
    const ast = parseICU1(
      "It's, {season, select, spring {spring} summer {summer} fall {fall} winter {winter}}!",
      { requiresOtherClause: false },
    );
    expect(serializeICU1Message(ast)).toBe(
      "It's, {season, select, spring {spring} summer {summer} fall {fall} winter {winter}}!",
    );
  });

  it("serializes plurals", () => {
    const ast = parseICU1(
      "{likes, plural, =0 {No Likes} one {One Like} other {# Likes}}",
      {
        requiresOtherClause: false,
      },
    );
    expect(serializeICU1Message(ast)).toBe(
      "{likes, plural, =0 {No Likes} one {One Like} other {# Likes}}",
    );
  });
});
