# @inlang/fluent-syntax-converters

Parse and serialize file formats to and from [Fluent](https://projectfluent.org/).

## Supported Converters (Formats)

**Goto [./src/converters](./src/converters)**

Missing a converter (format)? Make a pull request, or open a feature request [here](https://github.com/inlang/inlang/discussions/categories/feature-requests).

## Writing Converters

"It's simple". Only two functions are required `parse` and `serialize`. How they are implemented does not matter. We found [Peggy.js](https://github.com/peggyjs/peggy) useful to at least create a serialization grammar. A gentle introduction can be found [here](https://coderwall.com/p/316gba/beginning-parsers-with-peg-js).

**Tips for PEG(GY.js) parsing**

- use the online playground https://peggyjs.org/online
- copy & paste the grammer from/into the playground and from/into the adapters `grammar` variable
- run the unit tests
