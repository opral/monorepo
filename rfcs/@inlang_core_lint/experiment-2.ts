// base types

type NodeName =
  | "Identifier"
  | "Resource"
  | "Message"
  | "Pattern"
  | "Text"
  | "LanguageTag";

type Node<
  Name extends NodeName,
  Extension extends ExtensionInformation = Record<string, unknown>,
> = {
  type: Name;
} & Extension[Name] &
  Extension["Node"];

type Identifier<
  Extension extends ExtensionInformation = Record<string, unknown>,
> = Node<"Identifier", Extension> & {
  name: string;
};

type Resource<
  Extension extends ExtensionInformation = Record<string, unknown>,
> = Node<"Resource", Extension> & {
  languageTag: LanguageTag<Extension>;
  body: Array<Message<Extension>>;
};

type Message<Extension extends ExtensionInformation = Record<string, unknown>> =
  Node<"Message", Extension> & {
    id: Identifier<Extension>;
    pattern: Pattern<Extension>;
  };

type Pattern<Extension extends ExtensionInformation = Record<string, unknown>> =
  Node<"Pattern", Extension> & {
    elements: Array<Text<Extension>>;
  };

type Text<Extension extends ExtensionInformation = Record<string, unknown>> =
  Node<"Text", Extension> & {
    value: string;
  };

type LanguageTag<
  Extension extends ExtensionInformation = Record<string, unknown>,
> = Node<"LanguageTag", Extension> & {
  name: string;
};

type ExtensionInformation = {
  [node in NodeName | "Node"]?: Record<string, unknown>;
};

// ------------------------------------------------------------------------------------------------
// lint types

export type LintRule = "missing_key";

export type LintInformation = {
  type: LintRule;
  message: string;
};

export type LintResult = {
  lint?: {
    errors: Array<LintInformation>;
    warning: Array<LintInformation>;
  };
};

// ------------------------------------------------------------------------------------------------
// tests

type LintExtension = {
  lint?: LintInformation;
};

const lint = <R extends Resource>(
  resource: R,
): R &
  Resource<{
    Resource: LintExtension;
    Message: LintExtension;
    Pattern: LintExtension;
  }> => resource as any;

const linted = lint({
  type: "Resource",
  languageTag: {
    type: "LanguageTag",
    name: "en",
  },
  body: [
    {
      type: "Message",
      id: {
        type: "Identifier",
        name: "",
      },
      pattern: {
        type: "Pattern",
        elements: [
          {
            type: "Text",
            value: "Hello",
          },
        ],
      },
    },
  ],
});

linted.lint;
linted.body[0].lint;
linted.body[0].pattern?.lint;
// @ts-expect-error we haven't defined the extension for `Text` yet
linted.body[0].pattern.elements[0]?.lint;

const cache = <R extends Resource>(
  resource: R,
): R &
  Resource<{
    Node: { cache: Cache };
  }> => resource as any;

const cached = cache(linted);
cached.lint;
cached.body[0].cache;
cached.body[0].lint;

// ------------------------------------------------------------------------------------------------
// fully typed metadata object

type ResourceWithMetadata = Resource<{
  // use `Node` to extend every node
  Node: {
    metadata: {
      prop1: boolean;
    };
  };
}>;

const withMetadata: ResourceWithMetadata = undefined as any;
withMetadata.metadata.prop1;
// @ts-expect-error `''` is not a `boolean`
withMetadata.metadata.prop1 === "";
// @ts-expect-error `prop2` does not exist
withMetadata.metadata.prop2;
