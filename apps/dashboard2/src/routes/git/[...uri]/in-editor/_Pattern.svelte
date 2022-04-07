<script lang="ts">
	import { languageName } from '$lib/utils/languageName';

	export let serializedPattern: string | undefined;
	export let languageCode: string;
</script>

<sl-textarea rows="2" resize="auto" value={serializedPattern ?? ''}>
	<h4 slot="label" class="title-sm pb-1">{languageName(languageCode)}</h4>
</sl-textarea>
