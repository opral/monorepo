# typesafe-i18n converter

## CURRENTLY NOT SUPPORTED!

**Reason:**
Serializing a resource requires additional information which can not be derived from the fluent file / AST. Namely:

- the `languageCode` of each resource
- the projects `baseLanguage`

Theoretically the above could be achieved by extending the `Converter` api to hold additional, converter specific, arguments.
That makes the consumption of the api unbearable though. If a resource is serialized, the consuming program has to iterate through
all possible converter types to determine the right config instead of a simple `serialize({ format: 'localizable-strings' })`.

Any ideas how to design a simple and future-proof api that would allow the serialization of typesafe-i18n and potentially
other formats is appreciated.
