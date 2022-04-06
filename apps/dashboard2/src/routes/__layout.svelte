<script lang="ts">
	let showHamburgerMenu = false;
</script>

<nav class="bg-surface-100 text-on-surface text-body-md font-body-md px-2 sm:px-4 py-2.5 border-b">
	<div class="container flex flex-wrap justify-between items-center mx-auto">
		<a href="/" class="flex items-center text-headline-sm">Inlang</a>
		<!-- hamburger menu on mobile -->
		<button
			type="button"
			class="inline-flex items-center p-2 ml-3 text-headline-sm text-on-surface rounded-lg md:hidden hover:hover-on-surface focus:outline-none focus:ring-2 focus:focus-on-surface"
			aria-controls="mobile-menu"
			aria-expanded="false"
			on:click={() => {
				showHamburgerMenu = !showHamburgerMenu;
			}}
		>
			<span class="sr-only">Open main menu</span>
			<svg
				class="w-6 h-6"
				class:hidden={showHamburgerMenu}
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
				><path
					fill-rule="evenodd"
					d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
					clip-rule="evenodd"
				/></svg
			>
			<svg
				class="w-6 h-6"
				class:hidden={showHamburgerMenu === false}
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
				><path
					fill-rule="evenodd"
					d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
					clip-rule="evenodd"
				/></svg
			>
		</button>
		<div class="w-full md:block md:w-auto" class:hidden={showHamburgerMenu === false}>
			<ul class="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0">
				{#each [['Home', '/'], ['Todo', '#']] as [name, href]}
					<li>
						<a
							{href}
							class="block py-2 text-primary hover:text-hover-primary text-title-md rounded md:bg-transparent md:p-0"
							aria-current="page">{name}</a
						>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</nav>
<div class="container mx-auto mt-2 px-2 space-y-2 sm:px-0 bg-background text-on-background">
	<slot />
</div>
