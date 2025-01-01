// @ts-nocheck

import type { BundleNested } from "@inlang/sdk2";
import { it, expect } from "vitest";
import { createMessage } from "./parse.js";
import { plugin } from "./plugin.js";

it("exports files", async () => {
  const bundle1 = createBundle("sad_elephant", {
    en: "Hello World",
    de: "Hallo Welt",
  });

  const bundle2 = createBundle("penjamin", {
    en: "Greetings {name}",
    de: "Guten Tag {name}",
  });

  const files = await plugin.exportFiles!({
    bundles: [bundle1, bundle2],
    settings: {
      locales: ["en", "de"],
      baseLocale: "en",
      "plugin.inlang.icu-messageformat-1": {
        pathPattern: "./messages/{locale}.json",
      },
    },
  });

  const utf8 = new TextDecoder("utf-8");

  expect(files.length).toBe(2); // two languages
  const decodedFiles = files.map((file) => {
    return JSON.parse(utf8.decode(file.content));
  });

  expect(decodedFiles).toMatchInlineSnapshot(`
		[
			{
			"penjamin": "Greetings {name}",
			"sad_elephant": "Hello World",
			},
			{
			"penjamin": "Guten Tag {name}",
			"sad_elephant": "Hallo Welt",
			},
		]
	`);
});

function createBundle(
  id: string,
  messages: Record<string, string>
): BundleNested {
  return {
    id: id,
    alias: {},
    messages: Object.entries(messages).map(([locale, icu1]) =>
      createMessage({
        bundleId: id,
        messageSource: icu1,
        locale: locale,
      })
    ),
  };
}
