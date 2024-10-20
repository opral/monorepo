Reactivity is a bitch. Hard to reason about. Hard to debug. Hard to maintain.

The `/state` has been modelled under the following principles:

1. The state is derived from the files in lix.

   The files in lix are the source of truth. That's great for
   reproducibility (you can send the file(s) around, the state
   is always reproducible), crash resistance, and ensures that
   the interplay with lix (tracking changes) works.

2. Every setter writes to a lix file, not the in-memory state.

   Avoids running out of sync with the project file and ensures
   that lix is tracking changes correctly.

3. Reactivity is contained in `/state` and does not leak outside.

   Maintaining reactivity is a high effort. Especially if reactivity
   is all over the codebase. We learned this the hard way
   (like full refactor hard way). Thus, `/state` reactive side effects
   are modeled in `/state` alone.
