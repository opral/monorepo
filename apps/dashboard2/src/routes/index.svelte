<script>
	import { goto } from '$app/navigation';
</script>

<h1 class="title-md">Enter a URL</h1>
<div class="flex space-x-2">
	<sl-input class="w-full" placeholder="https://example.com" />
	<sl-button
		on:click={() => {
			window.open('https://launchhouse-demo.vercel.app/', '_blank');
			goto(`git/https://github.com/samuelstroschein/launchhouse-demo`);
		}}>Go</sl-button
	>
</div>
