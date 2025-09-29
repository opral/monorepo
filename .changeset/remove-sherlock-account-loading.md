---
"vs-code-extension": patch
---

Stop reading and persisting Lix account snapshots so Sherlock can load projects without triggering the `/name must be string` schema error. Should close https://github.com/opral/inlang-sherlock/issues/188
