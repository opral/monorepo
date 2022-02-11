# @inlang/i18n-detection

Package to detect the usage of i18n in source code.

## Example

_The example shows an example with the [t-function grammar](src/grammars).
Note that this package is designed to work with any kind of
referencing as long as a [grammar](src/grammars) exists._

**Source Code**

```html
<script>
  import { t } from 'i18n';

  const x = t('some-id');
</script>

<h1>Hello World</h1>
<p>{ t("another-id") }</p>
```

**Detected Usages**

_The `location` is an object holding information where the
match is located in the source code._

```js
[
  { id: 'some-id', location: location },
  { id: 'another-id', location: location },
];
```
