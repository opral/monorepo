---
"@inlang/plugin-i18next": patch
---

Fix the i18next importer reading the name of a group as a context or plural
suffix. `{ "q_frame": { "a": "x", "b": "y" } }` imported as one bundle `q` with
the contexts `frame.a` and `frame.b`; the keys are now the bundles `q_frame.a`
and `q_frame.b`. Suffixes are only read from the last path segment of a key,
after a name (`_one` is a key, not the plural of nothing). Bundle ids change
only for keys whose group name, or whose whole name, looked like a suffix, which
imported to bundles that no key of the file has. Keys next to the key they are a
context of (`shipping` and `shipping_free`) are still its context variants, as
before; set `contextValues` to read them as keys of their own.
