// import { onMount } from "solid-js";
// import { navigate } from "vite-plugin-ssr/client/router";
import { For } from "solid-js";
import { tableOfContent } from "./tableOfContent.js";

// export function Page() {
// 	onMount(() => {
// 		// redirect
// 		navigate("/blog/intro");
// 	});
// }
export function Page() {
	return (
		<div class=" min-h-full min-w-full items-center  space-y-4 md:space-y-0 py-4 md:grid gap-4 md:grid-cols-4  ">
			<For each={tableOfContent}>
				{(section) => (
					<sl-card class="card-overview min-h-full w-full">
						<img
							slot="image"
							src={section.imageSrc}
							alt="A kitten sits patiently between a terracotta pot and decorative grasses."
						/>
						<span class="h-48 grow">
							<strong class=" text-on-surface">{section.title}</strong>
							<p class=" min-h-full text-overflow: ellipsis;">
								{section.headline}
							</p>
							<a class="link link-primary text-primary" href={section.href}>
								... read more
							</a>
						</span>
					</sl-card>
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
