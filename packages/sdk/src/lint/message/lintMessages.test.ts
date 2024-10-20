import { beforeEach, describe, expect, test, vi } from "vitest";
import { lintMessages } from "./lintMessages.js";
import type {
  MessageLintReport,
  MessageLintRule,
} from "@inlang/message-lint-rule";
import type { Message } from "@inlang/message";

const lintRule1 = {
  id: "messageLintRule.x.1",
  displayName: { en: "" },
  description: { en: "" },

  run: vi.fn(),
} satisfies MessageLintRule;

const lintRule2 = {
  id: "messageLintRule.x.2",
  displayName: { en: "" },
  description: { en: "" },

  run: vi.fn(),
} satisfies MessageLintRule;

const message1 = { id: "m1" } as Message;
const message2 = { id: "m2" } as Message;
const message3 = { id: "m3" } as Message;

const messages = [message1, message2, message3];

describe("lintMessages", async () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("it should await all messages", async () => {
    let called = 0;
    lintRule2.run.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      called++;
    });

    await lintMessages({
      settings: {
        sourceLanguageTag: "en",
        languageTags: [],
        modules: [],
        messageLintRuleLevels: {
          [lintRule1.id]: "warning",
          [lintRule2.id]: "warning",
        },
      },
      messages,
      rules: [lintRule1, lintRule2],
    });

    expect(lintRule1.run).toHaveBeenCalledTimes(3);
    expect(called).toBe(3);
  });

  test("it should process all messages and rules in parallel", async () => {
    const fn = vi.fn();

    lintRule1.run.mockImplementation(async ({ message }) => {
      fn("r1", "before", message.id);
      await new Promise((resolve) => setTimeout(resolve, 0));
      fn("r1", "after", message.id);
    });
    lintRule2.run.mockImplementation(async ({ message }) => {
      fn("r2", "before", message.id);
      await new Promise((resolve) => setTimeout(resolve, 0));
      fn("r2", "after", message.id);
    });

    await lintMessages({
      settings: {
        sourceLanguageTag: "en",
        languageTags: [],
        modules: [],
        messageLintRuleLevels: {
          [lintRule1.id]: "warning",
          [lintRule2.id]: "warning",
        },
      },
      rules: [lintRule1, lintRule2],
      messages,
    });

    expect(fn).toHaveBeenCalledTimes(12);
    expect(fn).toHaveBeenNthCalledWith(1, "r1", "before", "m1");
    expect(fn).toHaveBeenNthCalledWith(2, "r2", "before", "m1");
    expect(fn).toHaveBeenNthCalledWith(3, "r1", "before", "m2");
    expect(fn).toHaveBeenNthCalledWith(4, "r2", "before", "m2");
    expect(fn).toHaveBeenNthCalledWith(5, "r1", "before", "m3");
    expect(fn).toHaveBeenNthCalledWith(6, "r2", "before", "m3");
    expect(fn).toHaveBeenNthCalledWith(7, "r1", "after", "m1");
    expect(fn).toHaveBeenNthCalledWith(8, "r2", "after", "m1");
    expect(fn).toHaveBeenNthCalledWith(9, "r1", "after", "m2");
    expect(fn).toHaveBeenNthCalledWith(10, "r2", "after", "m2");
    expect(fn).toHaveBeenNthCalledWith(11, "r1", "after", "m3");
    expect(fn).toHaveBeenNthCalledWith(12, "r2", "after", "m3");
  });

  test("it should not abort the linting process when errors occur", async () => {
    lintRule1.run.mockImplementation(({ report }) => {
      report({} as MessageLintReport);
    });
    lintRule2.run.mockImplementation(() => {
      throw new Error("error");
    });

    const { data, errors } = await lintMessages({
      settings: {
        sourceLanguageTag: "en",
        languageTags: [],
        modules: [],
        messageLintRuleLevels: {
          [lintRule1.id]: "warning",
          [lintRule2.id]: "warning",
        },
      },
      messages,
      rules: [lintRule1, lintRule2],
    });

    expect(data).toHaveLength(3);
    expect(errors).toHaveLength(3);
  });
});
