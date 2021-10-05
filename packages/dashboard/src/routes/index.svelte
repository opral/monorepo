<!-- redirecting the user to the projects -->
<script lang="ts" context="module">
	export async function load() {
		return {
			status: 302,
			redirect: '/project'
		};
	}
</script>
