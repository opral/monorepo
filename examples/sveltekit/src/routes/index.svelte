<script lang="ts" context="module">
	// Workaround until https://github.com/sveltejs/kit/pull/1810 is merged.
	//
	// Everytime a someone opens '/' which means no language is specified,
	// SvelteKit will redirect to '/en' as fallback.
	export async function load() {
		return {
			status: 302,
			redirect: '/en'
		};
	}
</script>
