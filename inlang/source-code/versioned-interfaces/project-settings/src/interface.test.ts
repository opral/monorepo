import { TypeCompiler } from "@sinclair/typebox/compiler";
import { ProjectSettings } from "./interface.js";
import { Value } from "@sinclair/typebox/value";
import { describe, it, expect } from "vitest";

describe("settings.languageTags", () => {
  it("should enforce unique language tags", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "en"],
      modules: [],
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(false);
  });
});

describe("settings.modules", () => {
  it("should be possible to use a jsdelivr uri", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [
        "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
      ],
    };
    const errors = [...Value.Errors(ProjectSettings, settings)];
    if (errors.length > 0) {
      console.error(errors);
    }
    expect(Value.Check(ProjectSettings, settings)).toBe(true);
  });
  it("should be possible to reference a local module", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: ["./my-module.js"],
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(true);
  });

  it("must enforce unique modules", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [
        "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
        "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
      ],
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(false);
  });

  it("must enforce a .js ending for modules", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [
        "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index",
      ],
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(false);
  });

  it("should enforce backwards compatible versioning (not SemVer)", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [
        "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index",
      ],
    };

    const passCases = [
      "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
      "https://cdn.jsdelivr.net/@3/dist/index.js",
    ];

    const failCases = [
      "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@5.1/dist/index.js",
      "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@5.1.2/dist/index.js",
    ];

    for (const passCase of passCases) {
      const config = { ...settings, modules: [passCase] };
      expect(Value.Check(ProjectSettings, config)).toBe(true);
    }

    for (const failCase of failCases) {
      const config = { ...settings, modules: [failCase] };
      expect(Value.Check(ProjectSettings, config)).toBe(false);
    }
  });
});

describe("settings.* (external settings)", () => {
  it("should be possible to have one nested object layer", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      "plugin.x.y": {
        hello: {
          world: 4,
        },
      },
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(true);
  });

  it("should pass messageLintRule|plugin|app|library keys", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
    };
    const passCases = [
      "app.namespace.ideExtension",
      "plugin.namespace.i18n",
      "library.namespace.i18n",
      "messageLintRule.namespace.helloWorld",
    ];

    for (const passCase of passCases) {
      const config = { ...settings, [passCase]: {} };
      expect(Value.Check(ProjectSettings, config)).toBe(true);
    }
  });

  // #2325 - types have been loosened to allow for new/unknown properties
  it("should enforce namespaces", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      // @ts-expect-error - Namespace is missing
      withoutNamespace: {},
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(true);
  });

  // #2325 - types have been loosened to allow for new/unknown properties
  it("should not fail on unknown types", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      // @ts-expect-error - unknown type
      "namespace.unknownType.name": {},
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(true);
  });

  // #2325 - types have been loosened to allow for new/unknown properties
  it("should not enforce camelCase", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
    };

    const failCases = [
      "plugin.namepsace.hello-World",
      "plugin.namepsace.HelloWorld",
      "plugin.namepsace.hello_world",
      "plugin.namepsace.hello world",
      "plugin.namepsace.hello-worlD",
    ];

    for (const failCase of failCases) {
      const config = { ...settings, settings: { [failCase]: {} } };
      expect(Value.Check(ProjectSettings, config)).toBe(true);
    }
  });

  it("should not be possible to use non-JSON values", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      "app.namespace.id": {
        // @ts-expect-error - Function is not a JSON
        myFunction: () => {
          return "Hello World";
        },
        hello: "World",
      },
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(false);
  });

  it("should be possible to use JSON values", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      "plugin.namespace.helloWorld": {
        hello: "World",
        bool: true,
        // eslint-disable-next-line unicorn/no-null
        null: null,
        number: 123,
        array: [1, 2, 3],
      },
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(true);
  });

  // #2325 - no longer blocking new/unknown keys since that breaks installed apps
  // when new features in project settings are rolled out
  it("should not be possible to define unknown project settings", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      // @ts-expect-error - unknown project key
      "project.unknown.name": {},
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(true);
  });

  it("should be possible to define known project settings", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      messageLintRuleLevels: {
        "messageLintRule.namespace.helloWorld": "error",
      },
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(true);
  });
});

it("should pass with valid real world configs and the typecompiler", () => {
  const SettingsParser = TypeCompiler.Compile(ProjectSettings);

  const configs: ProjectSettings[] = [
    {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [
        "https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js",
        "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@1/dist/index.js",
        "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@1/dist/index.js",
        "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@1/dist/index.js",
        "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@1/dist/index.js",
      ],
      messageLintRuleLevels: {
        "messageLintRule.inlang.missingTranslation": "error",
      },
      "plugin.inlang.json": {
        pathPattern: "./resources/{language}.json",
        variableReferencePattern: ["{", "}"],
      },
    },
  ];
  for (const config of configs) {
    expect(SettingsParser.Check(config)).toBe(true);
    expect(Value.Check(ProjectSettings, config)).toBe(true);
  }
});

describe("settings.$schema", () => {
  it("should be possible to define the schema", () => {
    const settings: ProjectSettings = {
      $schema: "https://inlang.com/schema/project-settings",
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(true);
  });

  it("should only allow the inlang schema schema", () => {
    const settings: ProjectSettings = {
      // @ts-expect-error - invalid schema link
      $schema: "https://inlang.com/schema/unknown",
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
      settings: {},
    };
    expect(Value.Check(ProjectSettings, settings)).toBe(false);
  });
});
