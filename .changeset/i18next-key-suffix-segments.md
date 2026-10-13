---
"@inlang/plugin-i18next": patch
---

Fix the i18next importer reading the name of a group as a context or plural
suffix. `{ "q_frame": { "a": "x", "b": "y" } }` imported as one bundle `q` with
the contexts `frame.a` and `frame.b`; the keys are now the bundles `q_frame.a`
and `q_frame.b`. Suffixes are only read from the last path segment of a key,
and `_one` is a key, not the plural of a key without a name (its bundle id was
empty). Bundle ids change only in projects with such keys, and for the keys
that were grouped with them (`q_male` next to `q_frame.a` was a context of `q`).
Keys next to the key they are a context of (`shipping` and `shipping_free`) are
still its context variants, as before; set `contextValues` to read them as keys
of their own.
