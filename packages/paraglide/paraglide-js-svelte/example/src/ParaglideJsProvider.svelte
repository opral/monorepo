<script>
  import { languageTag, onChangeLanguageTag } from '@inlang/paraglide-js';

  // initialize the language tag
  $: _languageTag = languageTag;

  onChangeLanguageTag((newLanguageTag) => {
    _languageTag = newLanguageTag;
  });
</script>

{#key _languageTag}
  <slot></slot>
{/key}