# i18n Library

## Definition

An i18n library loads translations into the runtime.

## Example

i18n libraries usally provide a function which can reference an id. The function
"looks up" the id in the translation files and formats the corresponding translation.

```svelte
<script>
  import { t } from "example-i18n-library";
</script>

<p>{t("example-id")}</p>
```

## Context

Inlang works on top of translation files. How those those translation(s) (files)
are loaded into software is job of an i18n library.

For a list of Fluent compatible libraries and examples, go to the [awesome-fluent-i18n repository](https://github.com/inlang/awesome-fluent-i18n).
