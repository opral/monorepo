# @inlang/paraglide-js

Paraglide JS is the i18n library for inlang projects. 

- [x] plug & play with the [inlang ecosystem](https://inlang.com/marketplace)
- [x] storage agnostic: use any message format you want (JSON, YAML, TOML, ...) via inlang plugins
- [x] compiler-based: efficient, typesafe and tiny (less than 1kb gzipped)
- [x] tree-shaking: only bundles the messages that are used
- [x] no async: SSR, SEO and instant loading

Paraglide JS compiles an inlang project into a use-case optimized i18n library. The keyword is "compiles". By leveraging a compiler, Paraglide JS eliminates a class of edge cases while also being simpler, faster, and more reliable than other i18n libraries. Oh, and it's also typesafe out of the box :) 


## Usage

Messages are imported as a namespace and can be used as follows:

```js
// m is a namespace that contains all messages of your project
// a bundler like rollup or webpack will only bundle the messages that are used
import * as m from "@inlang/paraglide-js/messages"
import { setLanguageTag } from "@inlang/paraglide-js"

// use a message
m.hello() // Hello world!

// message with parameters
m.loginHeader({ name: "Samuel" }) // Hello Samuel, please login to continue.

// change the language
setLanguageTag("de")
m.loginHeader({ name: "Samuel" }) // Hallo Samuel, bitte logge dich ein um fortzufahren.

```

Paraglide JS exports four runtime variables and functions via "@inlang/paraglide-js":

- `sourceLanguageTag`: the source language tag of the project
- `languageTags`: all language tags of the current project
- `languageTag()`: returns the language tag of the current user
- `setLanguageTag()`: sets the language tag of the current user


## Getting started

0. Ensure that you have a working inlang project. If you don't, follow the [getting started guide](https://inlang.com/documentation/getting-started).


1. Add paraglide as a dependency:

```bash
npm install @inlang/paraglide-js
```

2. Add the compiler to your build script:

```diff
{
  "scripts": {
+    "build": "paraglide-js compile"
  }
}
```
