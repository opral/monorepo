<script lang="ts">
	import { icon } from '$lib/utils/icon';
</script>

<!-- MENUBAR START -->
<div role="menubar" class="flex">
	<div role="searchbox" class="relative bg-surface-100 focus:bg-focus-surface-100">
		<div class="flex absolute inset-y-0 left-0 pl-2 items-center">
			<i class="{icon('search')} mr-2 " />
		</div>
		<input class="form-input pl-10" type="text" label="something" placeholder="HELLO" />
	</div>
</div>
<!-- MENUBAR END -->
<!-- CONTENT START -->
<div class="grid">
	<slot />
</div>
<!-- CONTENT END -->
