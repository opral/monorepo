# Import performance profiling

This harness measures the built checkout (SDK 4.0.2 and current plugins), not the published SDK 3.1.0 from issue #4485. It changes no Lix code. Build the SDK and plugins before running it:

```sh
pnpm --filter @inlang/sdk build
pnpm --filter './packages/plugins/**' build
node scripts/profile-imports.mjs --iterations=3 --cpu --output=/tmp/import-before.json
# Rebuild after editing source.
node scripts/profile-imports.mjs --iterations=3 --cpu --output=/tmp/import-after.json --compare=/tmp/import-before.json
```

`--cases=sdk-fresh,sdk-repeated,sdk-duplicates,sdk-json,sdk-next-intl` limits a run. Plugin case IDs include `plugin-inlang-message-format-30x5000`, `plugin-inlang-message-format-10x1000`, `plugin-inlang-message-format-1x200`, `plugin-i18next-2x3000`, `plugin-i18next-1x3000-long`, and JSON, next-intl, and ICU `10x1000` cases. Append `-export` to a plugin ID to measure its export. Directory cases are `directory-message-format-10x1000` and `directory-i18next-2x3000`.

Plugin cases run three times by default and report the median; SDK and directory cases run once to bound the old row-by-row paths. Repeated SDK import first populates the project outside the timer. SDK fixtures contain two locales and 100 bundles; directory fixtures reproduce the existing 10 locales × 1,000 keys benchmark and issue #4485's 2 locales × 3,000 bundles with 31 plural pairs in each locale (62 duplicate message pairs). Long i18next strings contain about 700 characters per key.

Only the measured import/export/load operation is timed and CPU-profiled. Fixture construction, project setup, normalization, SQL reads for snapshots, hashing, and cleanup are outside that interval. The inspector profile retained for each plugin case is its last iteration. Profiling adds overhead; use the same flags for both runs or omit `--cpu` on both sides for timings alone.

Comparison digests normalize generated IDs and Lix tracking metadata. Plugin messages are normalized by their effective `(bundleId, locale)` key so duplicate removal can be compared with the old result. This models last-message-wins only for these fixtures; it is not a generic proof that conflicting duplicates are interchangeable. SDK snapshots compare domain columns and resolve variant message IDs to bundle/locale references. These digests sort variant contents and therefore establish row-content parity, not first-match precedence; variant ordering must be checked by the SDK and plugin regression tests. Exports receive hydrated SDK-shaped rows with message and variant IDs. Each result is saved as soon as the case finishes; CPU profiles are saved beside the result JSON and can be opened in DevTools.

SDK query counts count Kysely statements issued by the import, excluding setup and snapshot reads. Directory cases currently do not instrument SQL. Profiles cover the main Node process; idle samples during SDK imports show time awaiting Lix's worker, not worker CPU attribution. Any reported round-trip reduction is in SDK-issued queries and does not imply that Lix internals were changed.

## Controlled SDK comparison

To separate the SDK change from machine contention, the original `importFiles.ts` from baseline commit `04587c3f5c` was transpiled beside the current SDK dist, keeping its unchanged relative dependencies. Original and revised functions imported the same current-plugin fixtures into separate fresh projects. Each case ran three alternating A/B trials in the same process with CPU profiling disabled. Setup and content verification were outside the timers. Domain content and variant precedence matched in every trial.

The harness also accepts `--sdk-import=/absolute/path/to/importFiles.baseline.js` for the isolated SDK cases, letting the original and revised implementations use the same current plugin builds. To prepare that module from the repository root:

```sh
node --input-type=module <<'JS'
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { transform } from './packages/plugins/i18next/node_modules/esbuild/lib/main.js';
const source = execFileSync('git', ['show', '04587c3f5c:packages/sdk/src/import-export/importFiles.ts'], { encoding: 'utf8' });
const result = await transform(source, { loader: 'ts', format: 'esm', target: 'node22' });
fs.writeFileSync('packages/sdk/dist/import-export/importFiles.baseline.js', result.code);
JS
```

Alternate harness invocations with and without `--sdk-import`, selecting the five `sdk-*` cases and omitting `--cpu`; run at least three trials. The controlled measurements below used the same approach inside one temporary process, with simple text and variable fixtures. The directory loader uses its own built SDK implementation and is not affected by `--sdk-import`.

| SDK case (2 locales × 100 keys) | Before ms | After ms | Speedup | Before SQL | After SQL |
| ------------------------------- | --------: | -------: | ------: | ---------: | --------: |
| fresh                           |      41.2 |     51.3 |   0.80× |          4 |         4 |
| duplicates                      |    1312.4 |     35.8 |  36.69× |       1304 |         4 |
| repeated                        |    1183.5 |    199.3 |   5.94× |       1301 |       504 |
| json                            |     322.6 |     43.0 |   7.49× |        701 |         4 |
| next-intl                       |     907.0 |     39.1 |  23.19× |       1101 |         4 |

The already-batched fresh path retained four SQL statements; its approximately 10 ms slower result in this small sample is reported rather than claimed as an improvement. Duplicate-message and explicit-ID imports gain the fresh batched path. Repeated imports retain row-wise writes for compatibility while reducing SELECTs from 801 to four.

## Measured checkout comparison

Node v22.23.2 on AMD Ryzen 9 9950X 16-Core Processor. CPU profiling enabled; measurements are elapsed wall time. All 23 content digests match. Values are synthetic workload measurements, not a guarantee for every project.

Plugin timings show significant run-to-run variance: unchanged JSON and ICU plugin code also ran faster in the second run. Those timing changes are controls, not claimed improvements. SDK query counts and the removal of the duplicate-triggered import path provide stronger evidence than subsecond plugin ratios.

| Case                                        | Before ms | After ms | Before SQL | After SQL |
| ------------------------------------------- | --------: | -------: | ---------: | --------: |
| plugin-inlang-message-format-30x5000        |    1276.2 |    474.7 |          — |         — |
| plugin-inlang-message-format-30x5000-export |    1361.4 |    515.3 |          — |         — |
| plugin-inlang-message-format-10x1000        |      78.3 |     21.8 |          — |         — |
| plugin-inlang-message-format-10x1000-export |      61.7 |     21.6 |          — |         — |
| plugin-inlang-message-format-1x200          |       0.6 |      0.5 |          — |         — |
| plugin-inlang-message-format-1x200-export   |       1.1 |      0.9 |          — |         — |
| plugin-i18next-2x3000                       |      80.4 |     33.9 |          — |         — |
| plugin-i18next-2x3000-export                |      76.0 |     19.0 |          — |         — |
| plugin-i18next-1x3000-long                  |     688.1 |     98.9 |          — |         — |
| plugin-i18next-1x3000-long-export           |      12.8 |      8.4 |          — |         — |
| plugin-json-10x1000                         |      64.1 |     27.8 |          — |         — |
| plugin-json-10x1000-export                  |      83.8 |     18.9 |          — |         — |
| plugin-next-intl-10x1000                    |     142.0 |     54.1 |          — |         — |
| plugin-next-intl-10x1000-export             |     157.3 |     79.9 |          — |         — |
| plugin-icu1-10x1000                         |     100.1 |     26.6 |          — |         — |
| plugin-icu1-10x1000-export                  |      48.5 |     15.2 |          — |         — |
| sdk-fresh                                   |     209.7 |     69.1 |          4 |         4 |
| sdk-repeated                                |    4911.5 |    308.7 |       1301 |       504 |
| sdk-duplicates                              |    3647.0 |     43.8 |       1304 |         4 |
| sdk-json                                    |    1094.0 |     56.1 |        701 |         4 |
| sdk-next-intl                               |    2656.5 |     44.2 |       1101 |         4 |
| directory-message-format-10x1000            |    3974.0 |   2083.1 |          — |         — |
| directory-i18next-2x3000                    |  283635.8 |   2026.6 |          — |         — |

The duplicate-message fixture previously triggered 803 SELECT and 501 INSERT statements for only 100 bundles and 200 effective messages. Repeated import triggered 801 SELECT and 500 INSERT statements. The main Node CPU profile spent most of these imports idle awaiting the Lix worker; the SDK issued these queries sequentially. The fresh unique fixture issued one SELECT and three batched INSERTs. The i18next directory fixture dropped from 283.6 seconds to 2.0 seconds with identical domain row contents.

The baseline i18next long-text import showed heavy garbage collection plus pattern parsing, consistent with allocating a substring and executing markup matching at each character. Message-format import showed substantial garbage collection and parsing time. Profiles retain exact functions and sampling counts beside the JSON results.

## Checked-in Vitest benchmarks

The repository's original benchmark files were also run before and after. These runs were not paired in one process; their raw means and relative margins of error are included without claiming a universal plugin speedup.

| Existing benchmark                |       Before mean |        After mean |
| --------------------------------- | ----------------: | ----------------: |
| Message-format import, 30 × 5,000 | 511.40 ms ±18.20% | 537.50 ms ±15.75% |
| Message-format import, 10 × 1,000 | 23.2560 ms ±6.96% | 28.8185 ms ±7.24% |
| Message-format import, 1 × 200    |  0.3511 ms ±4.18% |  0.3758 ms ±3.19% |
| Directory load, 10 × 1,000        |       2,275.32 ms |       1,895.81 ms |

Directory timings above contain one iteration each. The direct message-format benchmark runs did not show an improvement, reinforcing the need to separate exploratory timings from controlled evidence.

An independent reviewer also ran paired plugin comparisons with warmups, six alternating trials, and garbage collection between trials. Message-format's 30 × 5,000 fixture measured 538.8 ms before and 486.4 ms after (about 10% faster), with deeply equal outputs. The i18next long-text fixture measured 412.7 ms before and 209.4 ms after. These controlled comparisons support targeted allocation and parser improvements; they do not promise that every plugin or fixture runs faster.
