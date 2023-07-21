<script>
	import { languageTag, languages, languageTags, referenceLanguage, language, sourceLanguageTag } from "@inlang/sdk-js"
	$: console.log(1, language, languages, referenceLanguage);
	$: console.log(2, languageTag, languageTags, sourceLanguageTag);
</script>

{languageTags}

<slot />
