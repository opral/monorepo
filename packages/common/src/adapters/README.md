# Inlang Adapters

Inlang uses Fluent under tho hood. In order to support i18n libraries that do not use Fluent syntax,
adapters are required. The purpose of an adapter is to parse and serialize the file format used by
the specific i18n libray to and from Fluent syntax.

## Supported Adapters

✅ = supported
⭕ = partially supported
❌ = not supported

| Adapter       | Interpolation | Pluralization | Formatters |
|---------------|---------------|---------------|------------|
| typesafe-i18n |       ✅       |       ❌       |      ❌     |
| swift         |       ⭕       |       ❌       |      ❌     |

Missing an adapter? Open a feature request [here](https://github.com/inlang/inlang/discussions/categories/feature-requests).

## Writing Adapters

The adapters use PEG parsing with Peggy.js. A gentle introduction can be found [here](https://coderwall.com/p/316gba/beginning-parsers-with-peg-js).

- use the online playground https://peggyjs.org/online
- copy & paste the grammer from/into the playground and from/into the adapters `grammar` variable
- run the unit tests


