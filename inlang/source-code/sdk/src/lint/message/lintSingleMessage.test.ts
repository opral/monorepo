import { beforeEach, describe, expect, test, vi } from "vitest";
import { lintSingleMessage } from "./lintSingleMessage.js";
import type {
  MessageLintReport,
  MessageLintRule,
} from "@inlang/message-lint-rule";
import type { Message } from "@inlang/message";
import { tryCatch } from "@inlang/result";

const lintRule1 = {
  id: "messageLintRule.r.1",
  displayName: "",
  description: "",

  run: vi.fn(),
} satisfies MessageLintRule;

const lintRule2 = {
  id: "messageLintRule.r.2",
  displayName: "",
  description: "",

  run: vi.fn(),
} satisfies MessageLintRule;

const message1 = {} as Message;

const messages = [message1];

describe("lintSingleMessage", async () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("resolve rules and settings", async () => {
    // the lint function is un-opinionated and does not set a default level.
    // opinionated users like the inlang instance can very well set a default level (separation of concerns)
    test("it should throw if a lint level is not provided for a given lint rule", async () => {
      lintRule1.run.mockImplementation(({ report }) =>
        report({} as MessageLintReport),
      );

      const result = await tryCatch(() =>
        lintSingleMessage({
          settings: {
            sourceLanguageTag: "en",
            languageTags: ["en"],
            messageLintRuleLevels: {},
            modules: [],
          },
          messages,
          message: message1,
          rules: [lintRule1],
        }),
      );
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    test("it should override the default lint level", async () => {
      lintRule1.run.mockImplementation(({ report }) =>
        report({} as MessageLintReport),
      );

      const reports = await lintSingleMessage({
        settings: {
          sourceLanguageTag: "en",
          languageTags: ["en"],
          modules: [],
          messageLintRuleLevels: {
            [lintRule1.id]: "error",
          },
        },
        messages,
        message: message1,
        rules: [lintRule1],
      });
      expect(reports.data[0]?.level).toBe("error");
    });

    test("it should pass the correct settings", async () => {
      const settings = {
        sourceLanguageTag: "en",
        languageTags: ["en"],
        modules: [],
        messageLintRuleLevels: {
          [lintRule1.id as any]: "warning",
        },
      };

      const fn = vi.fn();
      lintRule1.run.mockImplementation(({ settings }) => fn(settings));

      await lintSingleMessage({
        settings,
        messages,
        message: message1,
        rules: [lintRule1],
      });

      expect(fn).toHaveBeenCalledWith(settings);
    });
  });

  test("it should await all rules", async () => {
    let m1Called = false;
    let m2Called = false;
    lintRule1.run.mockImplementation(() => {
      m1Called = true;
    });
    lintRule2.run.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      m2Called = true;
    });

    await lintSingleMessage({
      settings: {
        sourceLanguageTag: "en",
        languageTags: ["en"],
        modules: [],
        messageLintRuleLevels: {
          [lintRule1.id]: "warning",
          [lintRule2.id]: "warning",
        },
      },
      messages,
      message: message1,
      rules: [lintRule1, lintRule2],
    });

    expect(m1Called).toBe(true);
    expect(m2Called).toBe(true);
  });

  test("it should process all rules in parallel", async () => {
    const fn = vi.fn();

    lintRule1.run.mockImplementation(async () => {
      fn(lintRule1.id, "before");
      await new Promise((resolve) => setTimeout(resolve, 0));
      fn(lintRule1.id, "after");
    });
    lintRule2.run.mockImplementation(async () => {
      fn(lintRule2.id, "before");
      await new Promise((resolve) => setTimeout(resolve, 0));
      fn(lintRule2.id, "after");
    });

    await lintSingleMessage({
      settings: {
        sourceLanguageTag: "en",
        languageTags: ["en"],
        modules: [],
        messageLintRuleLevels: {
          [lintRule1.id]: "warning",
          [lintRule2.id]: "warning",
        },
      },
      messages,
      message: message1,
      rules: [lintRule1, lintRule2],
    });

    expect(fn).toHaveBeenCalledTimes(4);
    expect(fn).toHaveBeenNthCalledWith(1, lintRule1.id, "before");
    expect(fn).toHaveBeenNthCalledWith(2, lintRule2.id, "before");
    expect(fn).toHaveBeenNthCalledWith(3, lintRule1.id, "after");
    expect(fn).toHaveBeenNthCalledWith(4, lintRule2.id, "after");
  });

  test("it should not abort the linting process when errors occur", async () => {
    lintRule1.run.mockImplementation(() => {
      throw new Error("error");
    });

    lintRule2.run.mockImplementation(({ report }) => {
      report({} as MessageLintReport);
    });

    const result = await lintSingleMessage({
      settings: {
        sourceLanguageTag: "en",
        languageTags: ["en"],
        modules: [],
        messageLintRuleLevels: {
          [lintRule1.id]: "warning",
          [lintRule2.id]: "warning",
        },
      },
      messages,
      message: message1,
      rules: [lintRule1, lintRule2],
    });

    expect(result.data).length(1);
    expect(result.errors).length(1);
  });
});
