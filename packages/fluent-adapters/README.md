# @inlang/fluent-adapters

Parse and serialize i18n syntax to and from [Fluent syntax](https://projectfluent.org/).

Inlang uses [Fluent](https://projectfluent.org/) from Mozilla under the hood. In order to support i18n libraries / codebases that do not use Fluent, adapters are required. The purpose of an adapter is to parse and serialize the file format used by
the specific i18n libray to and from Fluent syntax.

## Supported Adapters

✅ = supported
⭕ = partially supported
❌ = not supported

| Adapter       | Interpolation | Pluralization | Formatters |
| ------------- | ------------- | ------------- | ---------- |
| typesafe-i18n | ✅            | ❌            | ❌         |
| swift         | ⭕            | ❌            | ❌         |

Missing an adapter? Open a feature request [here](https://github.com/inlang/inlang/discussions/categories/feature-requests).

## Writing Adapters

"It's simple". Only two functions are required `parse` and `serialize`. Depending on the complexity of the syntax, those two function can take some hours to implement though. We found PEG parsing with Peggy.js useful. A gentle introduction can be found [here](https://coderwall.com/p/316gba/beginning-parsers-with-peg-js). However, as long as `parse` and `serialize` yield the expected results, the underlying implementation does not matter (you don't have to use PEG parsing).

**Tips for PEG(GY.js) parsing**

- use the online playground https://peggyjs.org/online
- copy & paste the grammer from/into the playground and from/into the adapters `grammar` variable
- run the unit tests
