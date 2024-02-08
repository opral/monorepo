<script>
  import { languageTag, onSetLanguageTag } from '@inlang/paraglide-js/svelte-example';

  // initialize the language tag
  $: _languageTag = languageTag();

  onSetLanguageTag((newLanguageTag) => {
    _languageTag = newLanguageTag;
  });
</script>

{#key _languageTag}
  <slot></slot>
{/key}
