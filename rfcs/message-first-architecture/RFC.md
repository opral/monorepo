## Discussion angle

1. Does "message-first" data structure make sense?
2. Is a (massive) breaking change worth the upside?
3. Can we make/should we invest resources into making the transition smooth for existing users?

Here is a 19:59 minute loom https://www.loom.com/share/8ff46ee202374e52b376d4d029f10fe5 about this RFC.

## Problem

Inlang core, and thereby inlang itself, is architected "resource-first". Among things, "resource-first" leads to:

- Design flaws in inlang core [https://github.com/opral/inlang/issues/1096, https://github.com/opral/inlang/issues/945].
- Complicated application logic because apps care about messages, not resources.
- Potentially, technical debt when extending inlang (core) beyong messages to other types of content (e.g. markdown, images, etc.).

### Wrong assumptions with core's "resource-first" architecture

#### 1. [False] Resources are the primary data structure of inlang

That's not true. Messages is what matters to apps and users.

No inlang application does anything with resources. However, plugins do. The derived insight is that plugins deal with resources because plugins are the interface between app and source code. If this insight is true, apps should not care about resources.

#### 2. [False] A resource AST is required

Turned out to be false. Plugins re-construct resources from Messages, not from a resource AST.

Resources are almost always key-value data structures with a parsing and serialization spec. Precise knowledge how a resource file is "construcuted" e.g. message id "5" starts on line 3 column 5 is not required. As a matter of fact, the AST approach for resources doesn't even work because CRUD operations, by nature, do not contain information like message id "5" starts on line 3 column 5. CRUD operations not providing AST information lead to the [removal of `metadata`](https://github.com/opral/inlang/issues/945).

## Proposal

Inlang core should be refactored to be "message-first".

- Simplifies the application logic of inlang core and inlang apps.
- Simplify communication of inlang because the concept of "resources" is abstracted away/only plugins care about resources.
- Future-proofs inlang. Messages can be retrieved from anywhere (e.g. resources files, remote APIs, embedded databases).

### Application flow

> Don't take the API design too seriously. It's a sketch to illustrate the simplification.

- The general application flow is vastly simplified: No more resources, query, etc. Just `messages`.
- The `messages` object can be performance optimized internally.

#### 1. `config.getMessages()`

- Plugins can retrieve messages from anywhere (e.g. resources files, remote APIs, embedded databases).
- Future optimization: Only retrieve messages that are actually used in the app by passing a filter object.

```ts
const messages = await config.getMessages();
```

#### 2. CRUD operations

- No more `resources` or `query` objects
- Way simpler API.

```ts
messages = messages.create({
  id: "hello",
  languageTag: "en-US",
  body: "how are you?",
});

const message = messages.get({
  id: "hello",
  languageTag: "en-US",
  body: "how are you?",
});

messages = messages.update({
  id: "hello",
  languageTag: "en-US",
  body: "how are you doing?",
});

messages = messages.delete({
  id: "hello",
  languageTag: "en-US",
});
```

```ts
// For comparison, here is the current API:

const refResource = resources.find(
  (resource) => resource.languageTag.name === "en-US",
);
const message = query(refResource).get({
  id: "hello.login",
});

// -------------------

// this proposal
const message = messages.get({ id: "hello.login", languageTag: "en-US" });
```

#### 3. `config.saveMessages()`

- A plugin can save messages anywhere (e.g. resources files, remote APIs, embedded databases).

```ts
await config.saveMessages(messages);
```

### Plugins

- nothing changes for plugins except that they need to expose `saveMessages()` and `getMessages()`.

### Linting

- No more resources.
  -- Lint "messages" makes much more sense than linting "resources".
  -- Linting "messages" is what our lint system is about.
  -- Linting "resources" is the job of eslint, prettier, etc.

- Simpler internal structure.

#### Linting application flow

```ts
const [lints, errorsDuringLinting] = await lint({ messages, config });

lints.reports.filter((report) => report.level === "error");
```

```
[
  {
    result: "Missing translation for message 'hello' in language 'fr'."
    ...
  },
  {
    result: "Missing translation for message 'hello' in language 'de-DE'.",
    ...
  },
]

```

#### Writing lint rules

- Simple, plain JS. Simple to explain and maintain linting system.
- Performance optimized via the `messages` object.

##### Currently

```ts
export const missingTranslation = createLintRule({
  id: "inlang.missingTranslation",
  setup: ({ report }) => {
    let targetLanguage: LanguageTag["name"] | undefined;
    return {
      visitors: {
        Resource: ({ target }) => {
          // we need to derive the target language from the resource
          // because the message is missing.
          targetLanguage = target?.languageTag.name;
        },
        Message: ({ target, reference }) => {
          if (target === undefined && reference) {
            report({
              node: reference,
              message: `Message with id '${reference.id.name}' is missing for '${targetLanguage}'.`,
            });
          }
        },
      },
    };
  },
});
```

##### Proposal

> Note: This is a sketch. The API design should foster a discussion about the general direction.

- No more `Resource` nodes. Just `Message` linting.
- No more `target` and `reference` nodes. Just a `message` and all the `messages`.
- No more `"skip"` concept because performance is optimized via the `messages` object.
- The mental model is simple: "I have a message and I can query all the messages to derive is something is wrong"

```ts
export const missingTranslation = createLintRule({
  id: "inlang.missingTranslation",
  message: ({ message, messages, config }) => {
    if (message.languageTag !== config.referenceLanguageTag) {
      return;
    }
    const result: LintReport[] = [];
    for (const languageTag of config.languageTags) {
      // messages is performance optimized with an index. thus, this (should be) fast.
      const translation = messages.get({ id: message.id, languageTag });
      if (translation === undefined) {
        result.push({
          messageId: message.id,
          languageTag,
          message: `Missing translation for message '${message.id}' in language '${languageTag}'.`,
        });
      }
    }
    return result;
  },
});
```
