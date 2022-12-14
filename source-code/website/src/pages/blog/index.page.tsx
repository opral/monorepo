// import { onMount } from "solid-js";
// import { navigate } from "vite-plugin-ssr/client/router";
import { createSignal, For, Show } from "solid-js";
import { tableOfContent } from "./tableOfContent.js";

// export function Page() {
// 	onMount(() => {
// 		// redirect
// 		navigate("/blog/intro");
// 	});
// }
export function Page() {
	return (
		<div class=" flex-row min-h-full   items-center justify-center   mx-auto max-w-2xl divide-y divide-solid divide-outline  ">
			<For each={tableOfContent}>
				{(section) => (
					// <sl-card class="card-overview min-h-full w-full">
					// 	<img
					// 		slot="image"
					// 		src={section.imageSrc}
					// 		alt="A kitten sits patiently between a terracotta pot and decorative grasses."
					// 	/>
					// 	<span class="h-48 grow">
					// 		<strong class=" text-on-surface">{section.title}</strong>
					// 		<p class=" min-h-full text-overflow: ellipsis;">
					// 			{section.headline}
					// 		</p>
					// 		<a class="link link-primary text-primary" href={section.href}>
					// 			... read more
					// 		</a>
					//space-y-10 md:space-y-12 lg:space-y-14
					// 	</span>
					// </sl-card>

					<div class=" py-12">
						<a href={section.href} class="text-ellipsis  space-y-4  ">
							<p class="text-xl font-bold tracking-tight text-on-backround truncate ">
								{section.headline}
							</p>
							<p class="">{section.title} adsasd asd asdsadasdsa a dasdsad</p>
							<img
								class="object-contain w-full rounded"
								src={section.imageSrc}
							/>
							<p class="text-primary">Read more…</p>
						</a>
					</div>
				)}
			</For>
		</div>
	);
}

{
	/* <style>
  .card-overview {
    max-width: 300px;
  }

  .card-overview small {
    color: var(--sl-color-neutral-500);
  }

  .card-overview [slot='footer'] {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style> */
}
