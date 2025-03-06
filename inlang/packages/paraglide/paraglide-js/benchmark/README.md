# Benchmark

## Setup

- Use production translation files from [cal.com](https://github.com/calcom/cal.com/tree/0565e23818af2daa5569b6521bb08b6d88bd02d4/apps/web/public/static/locales) to resemble real-world scenario.

## Limiations

**Manually splitting translation files into namespaces can severely improve bundle size for i18next** 

Drawing the line on what to split and what not is vague. Instead of relying on heursitics, we decided to benchmark against open source production setup as is. 

We welcome a PR to another codebase to improve the benchmark.