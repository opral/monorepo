---
imports:
  - https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/packages/paraglide/paraglide-js/benchmark/benchmark-visualization.js
---

# Benchmark

This benchmark compares the transfer size of Paraglide JS (a compiler-based i18n library) against i18next (a runtime-based library).

## Key Takeaways

### Paraglide ships 3-10x smaller bundles than runtime libraries

In typical scenarios, Paraglide ships **47-144 KB** vs i18next's **205-422 KB**.

| Scenario | Paraglide | i18next | Difference |
|----------|-----------|---------|------------|
| 5 locales, 100 msgs used, 200 total | 47 KB | 205 KB | **4.4x smaller** |
| 10 locales, 100 msgs used, 200 total | 76 KB | 259 KB | **3.4x smaller** |
| 10 locales, 200 msgs used, 500 total | 144 KB | 422 KB | **2.9x smaller** |

### Tree-shaking makes Paraglide immune to total message count

**Runtime libraries ship all messages in a namespace, even unused ones.** Paraglide only ships messages you actually use on a page.

| Total messages | Messages used | Paraglide | i18next |
|----------------|---------------|-----------|---------|
| 200 | 100 | 47 KB | 205 KB |
| 500 | 100 | 47 KB | 283 KB |
| 1000 | 100 | 47 KB | 414 KB |

Paraglide's bundle size stays constant regardless of how many messages exist in your project—unused messages are tree-shaken away at build time.

Runtime libraries like i18next rely on manual namespacing to reduce bundle size, but namespaces still ship all their messages whether used or not. This means developers must carefully split messages across namespaces, and even then, unused messages within a namespace are still shipped.

### Why Paraglide ships smaller bundles

| Aspect | Paraglide (Compiler) | i18next (Runtime) |
|--------|----------------------|-------------------|
| **Unused messages** | Tree-shaken away | Shipped in bundle |
| **Runtime overhead** | ~300 bytes | ~8-10 KB |
| **Message format** | Compiled to functions | JSON dictionary |

---

For a feature comparison, see the [comparison table](/m/gerre34r/library-inlang-paraglideJs/comparison).

## Interactive Benchmark

Explore the full benchmark data with different configurations:

<benchmark-visualization src="https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/packages/paraglide/paraglide-js/benchmark/benchmark-results.json"></benchmark-visualization>

## Methodology

### What is Being Tested

The benchmark creates a static website for each configuration (library variant, number of locales, messages per page, and namespace size). Each website is loaded in a headless browser, and the total transfer size is measured.

- **Number of Locales**: How does an i18n library scale with the number of locales?
- **Number of used Messages**: How does an i18n library scale with the number of messages that are used on a given page?
- **Library Implementation Variants**: Testing different implementation approaches:
  - **Paraglide**:
    - `default`: Standard implementation
    - `experimental-`: Experimental implementation with per-locale splitting
  - **i18next**:
    - `http-backend`: Using HTTP backend for loading translations
- **Namespace Size**: Testing how the total available messages in a namespace affects bundle size

### Library modes

Each library is tested in different modes:

- **Paraglide**:
  - **default**: Out of the box Paraglide JS with no additional compiler options.
  - **<compiler-option>**: Mode with a [compiler option](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/compiler-options) that is being tested.
- **i18next**:
  - **default**: The default i18next implementation [source](https://www.i18next.com/overview/getting-started#basic-sample).
  - **http-backend**: i18next implementation using HTTP backend for loading translations on demand [source](https://github.com/i18next/i18next-http-backend).

### Limitations

**Choosing the number of messages and namespace varies between projects**

Some teams use per component namespacing while other teams have one namespace for their entire project. In cal.com's case, every component that uses i18n [loads at least 3000 messages per locale](https://github.com/calcom/cal.com/blob/b5e08ea80ffecff04363a18789491065dd6ccc0b/apps/web/public/static/locales/en/common.json).

To the point of the problem: Avoiding manual chunking of messages into namespaces is the benefit of Paraglide JS. The bundler tree-shakes all unused messages, making namespaces redundant.

## Contributing

Contributions to improve the benchmark are welcome.

1. adjust the build matrix in `build.config.ts`
2. run `pnpm run bench` to build the benchmark
3. run `pnpm run preview` to preview the results
