# RFC 003: Sandboxing the config

The config architecture of inlang is similar to Figma's plugin system. Figma allows developers to write plugins in JavaScript that are executed in the browser, similar to inlang's desire to execute config code in the browser. [This article](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) on Figma's blog goes into great length on different sandboxing approaches and trade-offs. Figma initially chose the [Realms shim developed by Agoric](https://github.com/agoric/realms-shim/). The Agoric Realms approach was eventually compromised and Figma switched to a [WebAssembly-based JavaScript runtime](https://bellard.org/quickjs/).

The design requirement for inlang are as follows:

- Eliminate malicious attacks that have impact beyond inlang components.
  A DOS (Denial of Service) attack by, for example, blocking the main thread via `while (true)` would be okay since it affects only a component itself and poses no harm outside of an app becoming unresponsive. Being able to access auth tokens stored in cookies via the global `window` variable in browsers could be devastating though.

- Support ES Modules (ESM) to consume exported functions and variables on demand. Executing a config similar to `eval` is not of interest.

- Execute async code. The filesystem API and other APIs are more readbale with an async API and will not block the main thread.

- Support the import of external scripts/packages. The flexibility of defining `readResources` and `writeResources` is handy but the ability to import third party code that deals with reading and writing resources reduces the adoption friction.

In response to the Realms shim compromise, Agoric designed the [SES (Secure ECMAScript)](https://github.com/endojs/endo/tree/master/packages/ses) proposal.

| Method             | Secure | ESM consumption | Async | Third party code | Bundle size       |
| ------------------ | :----: | --------------- | ----- | ---------------- | ----------------- |
| dynamic import     |   ❌   | ✅              | ✅    | ?                | 0kb               |
| ses                |   ✅   | ❌              |       | ❌               | ?kb               |
| shadow realms      |        | ✅              | ❌    |                  | 0kb in the future |
| Quick JS (runtime) |   ✅   |                 |       |                  | ~600kb            |
