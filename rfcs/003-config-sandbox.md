### 💡 Discuss the RFC [here](https://github.com/inlang/inlang/pull/129).

# RFC 003: Sandboxing the config

The config architecture of inlang is similar to Figma's plugin system. Figma allows developers to write plugins in JavaScript that are executed in the browser, similar to inlang's desire to execute config code in the browser. [This article](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) on Figma's blog goes into great length on different sandboxing approaches and trade-offs. Figma initially chose the [Realms shim developed by Agoric](https://github.com/agoric/realms-shim/). The Agoric Realms approach was eventually compromised and Figma switched to a [WebAssembly-based JavaScript runtime](https://bellard.org/quickjs/).

The design requirement for inlang are as follows:

- **Eliminate malicious attacks that have impact beyond inlang components.**
  
  A DOS (Denial of Service) attack by, for example, blocking the main thread via `while (true)` would be okay since it affects only a component itself and poses no harm outside of an app becoming unresponsive. Being able to access auth tokens stored in cookies via the global `window` variable in browsers could be devastating though.

- **Async. Otherwise, the main thread (UI) is blocked each time some config code is executed.**   

  This point is unrelated to the DOS argument. The DOS argument "crashed" the app once, and it's clear that the config is malicious. Blocking the main thread with each execution entails that the UI will lag. A bad UX, not a malicious attack.  

- **Support the import of external scripts/packages.** 

  The flexibility of defining `readResources()` and `writeResources()` is handy but the ability to import third party code that deals with reading and writing resources reduces the adoption friction.
  
- **Expose variables/APIs.**   
  
  Functions defined in the config like `readResources()` require the expose of a filesystem API. Dynamic business logic like `onSave()` requires the expose of   variables too. The simplest (consuming) API is likely to pass those variables when executing functions. For example, `readResources()` would become `readResourced(fs: FileSystem)`.   


## Comparison



| Method                                                            | Secure | ESM consumption | Async | Third party code | Bundle size       |
|-------------------------------------------------------------------|:------:|:---------------:|:-----:|:----------------:|-------------------|
| [dynamic import](https://github.com/tc39/proposal-dynamic-import) |    ❌   |        ✅        |   ✅   |         ?        | 0kb               |
| [SES](https://github.com/endojs/endo/tree/master/packages/ses)    |    ✅   |        ❌        |   ?   |         ❌        | ?kb               |
| [Shadow Realms](https://github.com/tc39/proposal-shadowrealm)     |    ?   |        ✅        |   ❌   |         ?        | 0kb in the future |
| [Quick JS (runtime)](https://bellard.org/quickjs/)                |    ✅   |        ❌        |   ✅   |         ✅        | ~1MB              |


**ESM consumption** refers importing and accessing code as if the code would not be sandboxed: 

```js
const module = await import('sandboxed-code')

const result = module.exampleFunction()
```

**Third party code** refers to the ability to import external code within the config: 

```js
// inlang.config.js
import { x } from "https://some.module/x.js"
```

### Overview 

Dynamic import is not suited due to zero security. SES seems suitable but third party code is not supported. 

