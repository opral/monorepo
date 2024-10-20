/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, it, describe } from "vitest";
import type { PluginSettings } from "./settings.js";
import {
  createVariant,
  getVariant,
  ProjectSettings,
  type Message,
  type Variant,
} from "@inlang/sdk";
import { plugin } from "./plugin.js";
import { createNodeishMemoryFs } from "@lix-js/fs";

const pluginId = "plugin.inlang.nextIntl";

describe("loadMessage", () => {
  it("should return messages if the path pattern is valid", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }));

    const pluginSettings: PluginSettings = {
      pathPattern: "./{languageTag}.json",
    };
    const messages = await plugin.loadMessages!({
      settings: {
        sourceLanguageTag: "en",
        languageTags: ["en"],
        modules: [],
        [pluginId]: pluginSettings,
      },
      nodeishFs: fs,
    });
    const variant = getVariant(messages[0]!, { where: { languageTag: "en" } });
    expect(variant?.pattern[0]?.type).toBe("Text");
  });

  it("should work with empty json files", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", JSON.stringify({}));
    const languageTags = ["en"];
    const settings: PluginSettings = {
      pathPattern: "./{languageTag}.json",
    };
    const sourceLanguageTag = "en";

    expect(
      plugin.loadMessages!({
        settings: {
          sourceLanguageTag,
          languageTags,
          modules: [],
          [pluginId]: settings,
        },
        nodeishFs: fs,
      }),
    ).resolves.toBeTruthy();
  });

  it("should work with not yet existing files", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }));
    const settings: PluginSettings = {
      pathPattern: "./{languageTag}.json",
    };
    const sourceLanguageTag = "en";
    const languageTags = ["en", "de"];
    expect(
      plugin.loadMessages!({
        settings: {
          sourceLanguageTag,
          languageTags,
          modules: [],
          [pluginId]: settings,
        },
        nodeishFs: fs,
      }),
    ).resolves.toBeTruthy();
  });

  it("should add multible variants to the same message", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }));
    await fs.writeFile("./de.json", JSON.stringify({ test: "Hallo welt" }));
    const settings: PluginSettings = {
      pathPattern: "./{languageTag}.json",
    };
    const languageTags = ["en", "de"];
    const sourceLanguageTag = "en";
    const messages = await plugin.loadMessages!({
      settings: {
        sourceLanguageTag,
        languageTags,
        modules: [],
        [pluginId]: settings,
      },
      nodeishFs: fs,
    });
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } }),
    ).toBeTruthy();
    expect(
      getVariant(messages[0]!, { where: { languageTag: "de" } }),
    ).toBeTruthy();
  });
});

describe("saveMessage", () => {
  it("test string pathPattern", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", JSON.stringify({}));
    const settings: PluginSettings = {
      pathPattern: "./{languageTag}.json",
    };
    const messages: Message[] = [
      {
        id: "test",
        alias: {},
        selectors: [],
        variants: [
          {
            languageTag: "en",
            match: [],
            pattern: [
              {
                type: "Text",
                value: "Hello world",
              },
            ],
          },
        ],
      },
    ];
    await plugin.saveMessages!({
      messages,
      settings: {
        [pluginId]: settings,
      } as any,
      nodeishFs: fs,
    });
  });
});

describe("variable reference", () => {
  it("should correctly identify variable reference (at the end)", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile(
      "./en.json",
      JSON.stringify({ test: "Hello {{username}}" }),
    );
    const pluginSettings: PluginSettings = {
      pathPattern: "./{languageTag}.json",
    };
    const sourceLanguageTag = "en";
    const languageTags = ["en"];
    const messages = await plugin.loadMessages!({
      settings: {
        languageTags,
        sourceLanguageTag,
        modules: [],
        [pluginId]: pluginSettings,
      },
      nodeishFs: fs,
    });
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } })?.pattern
        .length,
    ).toBe(2);
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } })?.pattern[0]
        ?.type,
    ).toBe("Text");
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } })?.pattern[1]
        ?.type,
    ).toBe("VariableReference");
  });

  it("should correctly identify variable reference (at the beginning)", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile(
      "./en.json",
      JSON.stringify({ test: "{{username}} the great" }),
    );
    const pluginSettings: PluginSettings = {
      pathPattern: "./{languageTag}.json",
    };
    const languageTags = ["en"];
    const sourceLanguageTag = "en";
    const messages = await plugin.loadMessages!({
      settings: {
        sourceLanguageTag,
        languageTags,
        modules: [],
        [pluginId]: pluginSettings,
      },
      nodeishFs: fs,
    });
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } })?.pattern
        .length,
    ).toBe(2);
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } })?.pattern[0]
        ?.type,
    ).toBe("VariableReference");
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } })?.pattern[1]
        ?.type,
    ).toBe("Text");
  });

  it("should correctly apply the variableReferencePattern", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile(
      "./en.json",
      JSON.stringify({ test: "Hello @username" }),
    );
    const pluginSettings: PluginSettings = {
      pathPattern: "./{languageTag}.json",
      variableReferencePattern: ["@"],
    };
    const languageTags = ["en"];
    const sourceLanguageTag = "en";
    const messages = await plugin.loadMessages!({
      settings: {
        languageTags,
        sourceLanguageTag,
        modules: [],
        [pluginId]: pluginSettings,
      },
      nodeishFs: fs,
    });
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } })?.pattern[0]
        ?.type,
    ).toBe("Text");
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } })?.pattern[1]
        ?.type,
    ).toBe("VariableReference");
  });
});

describe("sourceLanguageFilePath", () => {
  it("should resolve the sourceLanguageFilePath", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./main.json", JSON.stringify({ test: "Hello world" }));
    await fs.writeFile("./de.json", JSON.stringify({ test: "Hallo Welt" }));

    const pluginSettings: PluginSettings = {
      pathPattern: "./{languageTag}.json",
      sourceLanguageFilePath: "./main.json",
    };

    const languageTags = ["en", "de"];
    const sourceLanguageTag = "en";
    const messages = await plugin.loadMessages!({
      settings: {
        sourceLanguageTag,
        languageTags,
        modules: [],
        [pluginId]: pluginSettings,
      },
      nodeishFs: fs,
    });
    expect(
      getVariant(messages[0]!, { where: { languageTag: "en" } }),
    ).toBeTruthy();
    expect(
      getVariant(messages[0]!, { where: { languageTag: "de" } }),
    ).toBeTruthy();
  });
});

describe("formatting", () => {
  it("should preserve the order of ids for pathPattern string", async () => {
    const content = JSON.stringify(
      { a: "test", z: "test", b: "test" },
      undefined,
      2,
    );
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", content);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });

    await plugin.saveMessages!({
      messages: messages,
      settings,
      nodeishFs: fs,
    });

    const newContent = await fs.readFile("./en.json", { encoding: "utf-8" });

    expect(content).toStrictEqual(newContent);
  });

  it("should handle empty objects correctly", async () => {
    const content = JSON.stringify(
      {
        a: "test",
        b: {},
      },
      undefined,
      2,
    );
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", content);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });

    await plugin.saveMessages!({
      messages: messages,
      settings,
      nodeishFs: fs,
    });

    const newContent = await fs.readFile("./en.json", { encoding: "utf-8" });

    expect(JSON.parse(newContent).b).toBeUndefined();
  });

  it("should preserve the spacing of the source language and determine the spacing for new language resources", async () => {
    // @prettier-ignore
    const with4Spaces = `{
    "test": "test"
}`;

    // @prettier-ignore
    const withTabs = `{
	"test": "test"
}`;

    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", with4Spaces);
    await fs.writeFile("./fr.json", with4Spaces);
    await fs.writeFile("./de.json", withTabs);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de", "fr"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });

    const variant: Variant = {
      languageTag: "es",
      match: [],
      pattern: [
        {
          type: "Text",
          value: "test",
        },
      ],
    };
    const newMessage = createVariant(messages[0]!, {
      data: variant,
    }).data;

    await plugin.saveMessages!({
      messages: [newMessage!],
      settings: settings,
      nodeishFs: fs,
    });

    const file1 = await fs.readFile("./en.json", { encoding: "utf-8" });
    const file2 = await fs.readFile("./fr.json", { encoding: "utf-8" });
    const file3 = await fs.readFile("./de.json", { encoding: "utf-8" });
    const file4 = await fs.readFile("./es.json", { encoding: "utf-8" });

    expect(file1).toBe(with4Spaces);
    expect(file2).toBe(with4Spaces);
    expect(file3).toBe(with4Spaces);
    expect(file4).toBe(with4Spaces);
  });

  it("should preserve the 'ends with new line' of the source language and determine it for new language resources", async () => {
    // @prettier-ignore
    const withNewLine = `{
	"test": "test"
}
`;

    // @prettier-ignore
    const withoutNewLine = `{
	"test": "test"
}`;

    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", withNewLine);
    await fs.writeFile("./fr.json", withoutNewLine);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de", "fr"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });
    await plugin.saveMessages!({
      messages,
      settings,
      nodeishFs: fs,
    });
    const file1 = await fs.readFile("./en.json", { encoding: "utf-8" });
    const file2 = await fs.readFile("./fr.json", { encoding: "utf-8" });
    expect(file1).toBe(withNewLine);
    expect(file2).toBe(withNewLine);
  });

  it("should escape `.` in flattened json structures", async () => {
    const enResource = `{
    "test.": "test",
	"test.test": "test"
}`;

    const fs = createNodeishMemoryFs();
    await fs.mkdir("./en");
    await fs.writeFile("./en.json", enResource);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });
    const reference: Message[] = [
      {
        id: "test.",
        alias: {},
        selectors: [],
        variants: [
          {
            languageTag: "en",
            match: [],
            pattern: [
              {
                type: "Text",
                value: "test",
              },
            ],
          },
        ],
      },
      {
        id: "test.test",
        alias: {},
        selectors: [],
        variants: [
          {
            languageTag: "en",
            match: [],
            pattern: [
              {
                type: "Text",
                value: "test",
              },
            ],
          },
        ],
      },
    ];

    expect(messages).toStrictEqual(reference);
  });

  it("should escape `.` in nested json structures", async () => {
    const enResource = `{
	"a.": {
		"b": "test"
	},
	"c.": "test"
}`;

    const fs = createNodeishMemoryFs();
    await fs.mkdir("./en");
    await fs.writeFile("./en.json", enResource);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });
    const reference: Message[] = [
      {
        id: "a..b",
        alias: {},
        selectors: [],
        variants: [
          {
            languageTag: "en",
            match: [],
            pattern: [
              {
                type: "Text",
                value: "test",
              },
            ],
          },
        ],
      },
      {
        id: "c.",
        alias: {},
        selectors: [],
        variants: [
          {
            languageTag: "en",
            match: [],
            pattern: [
              {
                type: "Text",
                value: "test",
              },
            ],
          },
        ],
      },
    ];
    expect(messages).toStrictEqual(reference);
    await plugin.saveMessages!({
      messages,
      settings,
      nodeishFs: fs,
    });
    const file = await fs.readFile("./en.json", { encoding: "utf-8" });
    const json = JSON.parse(file as string);
    expect(json["a."].b).toStrictEqual("test");
    expect(json["c."]).toStrictEqual("test");
  });

  it("should correctly detect the nesting in the source file and determine for new ones", async () => {
    const withNesting = JSON.stringify(
      {
        test: {
          test: "test",
        },
      },
      undefined,
      2,
    );

    const withoutNesting = JSON.stringify(
      {
        "test.test": "test",
      },
      undefined,
      4,
    );

    const fs = createNodeishMemoryFs();

    await fs.writeFile("./en.json", withNesting);
    await fs.writeFile("./fr.json", withNesting);
    await fs.writeFile("./de.json", withoutNesting);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de", "fr"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });

    messages.push({
      id: "test.test",
      alias: {},
      selectors: [],
      variants: [
        {
          languageTag: "es",
          match: [],
          pattern: [
            {
              type: "Text",
              value: "test",
            },
          ],
        },
      ],
    });

    await plugin.saveMessages!({
      messages,
      settings,
      nodeishFs: fs,
    });

    const file1 = await fs.readFile("./en.json", { encoding: "utf-8" });
    const file2 = await fs.readFile("./fr.json", { encoding: "utf-8" });
    const file3 = await fs.readFile("./de.json", { encoding: "utf-8" });
    const file4 = await fs.readFile("./es.json", { encoding: "utf-8" });

    expect(file1).toBe(withNesting);
    expect(file2).toBe(withNesting);
    expect(file3).toBe(withNesting);
    expect(file4).toBe(withNesting);
  });
});

describe("roundTrip", () => {
  it("should serialize newly added messages", async () => {
    const enResource = `{
	"test": "{{username}}"
}`;

    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", enResource);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });
    const variant: Variant = {
      languageTag: "en",
      match: [],
      pattern: [
        {
          type: "Text",
          value: "This is new",
        },
      ],
    };
    const newMessage: Message = {
      id: "test2",
      alias: {},
      selectors: [],
      variants: [variant],
    };
    messages.push(newMessage);
    await plugin.saveMessages!({
      messages,
      settings,
      nodeishFs: fs,
    });
    const newFile = (await fs.readFile("./en.json", {
      encoding: "utf-8",
    })) as string;
    const json = JSON.parse(newFile);
    expect(json.test).toBe("{{username}}");
    expect(json.test2).toBe("This is new");
  });

  it("should successfully do a roundtrip with complex content", async () => {
    const complexContent = JSON.stringify(
      {
        "//multiLineString": {
          multiline: "This is a\nmulti-line\nstring.",
        },
        unicodeCharacters: {
          emoji: "\uD83D\uDE00",
          currency: "€",
        },
        test: 'Single "quote" test',
      },
      undefined,
      4,
    );
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", complexContent);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });
    plugin.saveMessages!({
      messages,
      settings,
      nodeishFs: fs,
    });
    const newMessage = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });
    expect(newMessage).toStrictEqual(messages);
  });

  it("should successfully do a roundtrip with empty message value", async () => {
    const test = JSON.stringify({
      test: "",
    });
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./en.json", test);

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });

    plugin.saveMessages!({
      messages,
      settings,

      nodeishFs: fs,
    });
    const newMessage = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });
    expect(newMessage).toStrictEqual(messages);
  });

  it("should successfully do a roundtrip using sourceLanguageFilePath", async () => {
    const fs = createNodeishMemoryFs();
    await fs.writeFile("./main.json", JSON.stringify({ test: "Hello world" }));
    await fs.writeFile("./de.json", JSON.stringify({ test: "Hallo Welt" }));

    const settings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      [pluginId]: {
        pathPattern: "./{languageTag}.json",
        sourceLanguageFilePath: "./main.json",
      } satisfies PluginSettings,
    } satisfies ProjectSettings;

    const messages = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });
    plugin.saveMessages!({
      messages,
      settings,
      nodeishFs: fs,
    });
    const newMessage = await plugin.loadMessages!({
      settings,
      nodeishFs: fs,
    });
    expect(await fs.readdir("./")).toStrictEqual(["main.json", "de.json"]);
    expect(newMessage).toStrictEqual(messages);
  });
});
