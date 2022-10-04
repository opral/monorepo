<script lang="ts">
	let disabled = false;
</script>

<!-- <in-button {disabled} class="button-primary label-lg">Click me</in-button> -->

<div>
	<in-button {disabled} class="button-primary"> Click d </in-button>

	<in-button {disabled} class="button-primary">
		<span class="material-symbols-rounded"> settings </span>
		<span> Click me </span>
	</in-button>

	<in-button {disabled} class="button-primary">
		<span class="material-symbols-rounded"> settings </span>
	</in-button>

	<in-button {disabled} class="button-primary">
		<span class="icon"> settings </span>
	</in-button>
</div>
