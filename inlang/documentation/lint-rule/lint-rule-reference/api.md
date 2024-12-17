# Lint Rule API

## Meta information

In order to effectively showcase our product in the marketplace and during installation, it is crucial to include the meta information.

### id

`messageLintRule.${string}.${string}` `required`

Unique id of module. Consists of type (messageLintRule), author and name.

```ts
// Example
id: "messageLintRule.inlang.missingTranslation";
```

### displayName

`Record<LanguageTag, string>` `required`
The name that is displayed in the marketplace. The name will be localized in the future that's why there is the [languageTag](/documentation/concept/language-tag). For now `en` is fine.

```ts
// Example
displayName: {
  en: "Lint Rule Name";
}
```

### description

`Record<LanguageTag, string>` `required`
The description that is displayed in the marketplace. It will be localized in the future that's why there is the languageTag. For now `en` is fine.

```ts
// Example
description: {
  en: "This is the Lint Rule description";
}
```

<br/>

## Lint Logic

Where you define and execute your custom linting logic, analyzing message variants and reporting issues as needed.

### message

`function`

This function named `message` receives a message along with additional contextual information, such as `languageTags`, `sourceLanguageTag`, and a `report` callback.

```ts
message: (args: {
  message: Message;
  settings: ProjectSettings & ExternalSettings;
  report: (args: {
    messageId: Message["id"];
    languageTag: LanguageTag;
    body: MessageLintReport["body"];
  }) => void;
}) => MaybePromise<void>;
```

You can find a video tutorial here: https://www.youtube.com/watch?v=MW9LjRghSWg
