Reactivity is a bitch. Hard to reason about. Hard to debug. Hard to maintain. 

Therefore, the `/state` has been modelled under the following principles: 

1. The state is derived from the files in lix.
   
   The files in lix are the source of truth. That's great for 
   reproducability (you can send the file(s) around, the state
   is always reproducable), crash resistance, and ensures that 
   the interplay with lix (tracking changes) works. 

2. Reactivity is contained in `/state` and does not leak outside.
   
   Maintaining reactivity is high effort. Especially, if reactivity
   is all over the codebase. We learned this the hard way
   (like full refactor hard way). Thus, `/state` reactive side effects
   are modelled in `/state` alone. 

