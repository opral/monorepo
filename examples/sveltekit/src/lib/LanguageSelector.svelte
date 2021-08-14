<script>
	import { page } from '$app/stores';

	let options = [
		{ lang: 'en', flag: `🇩🇬` },
		{ lang: 'de', flag: `🇩🇪` },
		{ lang: 'fr', flag: `🇫🇷` },
		{ lang: 'es', flag: `🇪🇸` }
	];

	let selectedLanguage = $page.params.lang;

	function handleLanguageSelection() {
		// Waiting till https://github.com/sveltejs/kit/pull/1810 is merged.
	}
</script>

<div style="display: flex; flex-direction: row; align-items: center">
	<h4 style="margin-right: 10px">Language:</h4>
	<form>
		<!-- disabled https://github.com/sveltejs/kit/pull/1810 until  -->
		<select disabled bind:value={selectedLanguage} on:change={handleLanguageSelection}>
			{#each options as option}
				<option value={option.lang}>
					{option.lang}
					{option.flag}
				</option>
			{/each}
		</select>
	</form>
</div>
