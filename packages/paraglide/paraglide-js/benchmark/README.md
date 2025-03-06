# Paraglide-JS vs i18next Benchmark

## Introduction

The internationalization (i18n) library you choose can significantly impact your application's bundle size and overall performance. 

This benchmark provides data-driven insights comparing Paraglide-JS with i18next, one of the most popular i18n solutions.

### What is Being Tested

This benchmark evaluates the bundle size implications of both libraries across various scenarios:

- **Number of Locales**: How does an i18n library scale with the number of locales?
- **Number of Message per page**: How does an i18n library scale with the number of messages that are used on a given page?
- **Library Implementation Variants**: Testing different implementation approaches:
  - **Paraglide**: 
    - `default`: Standard implementation
    - `experimental-`: Experimental implementation with per-locale splitting
  - **i18next**:
    - `http-backend`: Using HTTP backend for loading translations
- **Namespace Size**: Testing how the total available messages in a namespace affects bundle size

### Key Considerations

#### The Paraglide Approach

Paraglide takes a different approach to i18n by compiling messages into tree-shakable functions. Bundlers are able to tree-shake and include only the used messages for any given page. This has important implications.

#### Work in Progress

We are actively working on per-locale splitting to further optimize bundle size for applications with many languages and messages. Find more information in issue [#88](https://github.com/opral/inlang-paraglide-js/issues/88).

## Setup

The benchmark creates a static website for each configuration (library variant, number of locales, messages per page, and namespace size). Each website is loaded in a headless browser, and the total transfer size is measured.

### Library modes

Each library is tested in different modes:

- **Paraglide**: 
  - **default**: Out of the box Paraglide JS with no additional compiler options.
  - **<compiler-option>**: Mode with a [compiler option](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/compiler-options) that is being tested. 
- **i18next**: 
  - **default**: The default i18next implementation [source](https://www.i18next.com/overview/getting-started#basic-sample).
  - **http-backend**: i18next implementation using HTTP backend for loading translations on dmeand [source](https://github.com/i18next/i18next-http-backend).
  
### Metrics

- **Total Transfer Size**: The total transfer size of the website.
- **Messages**: The number of messages per page.
- **Namespace Size**: The total number of messages in the namespace.
- **Locales**: The number of locales.

### Limitations

**Choosing the number of messages and namespace varies between projects**

Some teams use per component namespacing while other teams have one namespace for their entire project. In cal.com's case, every component that uses i18n [loads at least 3000 messages per locale](https://github.com/calcom/cal.com/blob/b5e08ea80ffecff04363a18789491065dd6ccc0b/apps/web/public/static/locales/en/common.json).

To the point of the problem: Avoiding manual chunking of messages into namespaces is the benefit of Paraglide JS. The bundler tree-shakes all unused messages, making namespaces redundant.


## Results

TL;DR: 

- Paraglide JS is always more efficient than i18next for projects with <15 locales. 
- Dependent on the namespace size, i18next can be more efficient than Paraglide JS for projects with >15 locales.


`Locales: 5`  
`Messages: 200`   
`Namespace Size: 500` 

| Library                                           | Total Transfer Size | 
|---------------------------------------------------|---------------------| 
| paraglide (experimental-middleware-optimizations) | 31.5 KB             | 
| paraglide (default)                               | 90.1 KB             | 
| i18next (default)                                 | 694.3 KB            | 
| i18next (http-backend)                            | 191.0 KB            | 


`Locales: 10`  
`Messages: 200`   
`Namespace Size: 500` 

| Library                                           | Total Transfer Size | 
|---------------------------------------------------|---------------------| 
| paraglide (experimental-middleware-optimizations) | 31.6 KB             | 
| paraglide (default)                               | 148.3 KB            | 
| i18next (default)                                 | 694.3 KB            | 
| i18next (http-backend)                            | 191.0 KB            | 


`Locales: 20`  
`Messages: 200`   
`Namespace Size: 500` 

| Library                                           | Total Transfer Size | 
|---------------------------------------------------|---------------------| 
| paraglide (experimental-middleware-optimizations) | 31.7 KB             | 
| paraglide (default)                               | 266.1 KB            | 
| i18next (default)                                 | 694.3 KB            | 
| i18next (http-backend)                            | 191.1 KB            | 


## Contributing

Contributions to improve the benchmark are welcome. 

1. adjust the build matrix in `build.config.ts` 
2. run `pnpm run bench` to build the benchmark
3. run `pnpm run preview` to preview the results
