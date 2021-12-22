<script lang="ts">
	let classes = '';

	// workaround to pass classes to a component
	export { classes as class };
</script>

<!-- color corresponds to https://www.carbondesignsystem.com/guidelines/color/overview/ -->
<div class={classes}>
	<div class="w-full h-0.5 my-1" style="background-color: #e0e0e0" />
</div>
