---
imports: 
  - https://raw.githubusercontent.com/opral/monorepo/parjs-446-create-a-graph-in-the-benchmark/inlang/packages/paraglide/paraglide-js/benchmark/benchmark-visualization.js
---

# Benchmark

The internationalization (i18n) library you choose can significantly impact your application's bundle size and overall performance.


<benchmark-visualization src="https://raw.githubusercontent.com/opral/monorepo/parjs-446-create-a-graph-in-the-benchmark/inlang/packages/paraglide/paraglide-js/benchmark/benchmark-results.json"></benchmark-visualization>


### What is Being Tested

The benchmark creates a static website for each configuration (library variant, number of locales, messages per page, and namespace size). Each website is loaded in a headless browser, and the total transfer size is measured.

- **Number of Locales**: How does an i18n library scale with the number of locales?
- **Number of Message per page**: How does an i18n library scale with the number of messages that are used on a given page?
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
  - **http-backend**: i18next implementation using HTTP backend for loading translations on dmeand [source](https://github.com/i18next/i18next-http-backend).

### Limitations

**Choosing the number of messages and namespace varies between projects**

Some teams use per component namespacing while other teams have one namespace for their entire project. In cal.com's case, every component that uses i18n [loads at least 3000 messages per locale](https://github.com/calcom/cal.com/blob/b5e08ea80ffecff04363a18789491065dd6ccc0b/apps/web/public/static/locales/en/common.json).

To the point of the problem: Avoiding manual chunking of messages into namespaces is the benefit of Paraglide JS. The bundler tree-shakes all unused messages, making namespaces redundant.

## Contributing

Contributions to improve the benchmark are welcome.

1. adjust the build matrix in `build.config.ts`
2. run `pnpm run bench` to build the benchmark
3. run `pnpm run preview` to preview the results
