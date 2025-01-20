<script lang="ts">
  import { ParaglideSveltekit} from "@inlang/paraglide-sveltekit";
  import * as runtime from "$lib/paraglide/runtime";
</script>

<ParaglideSveltekit {runtime}>
  <slot></slot>
</ParaglideSveltekit>