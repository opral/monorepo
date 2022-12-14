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
					<div class=" py-12">
						<a href={section.href} class="text-ellipsis  space-y-4  ">
							<p class="text-xl font-bold tracking-tight text-on-backround truncate ">
								{section.headline}
							</p>
							<p class="">
								{section.subHeadline} adsasd asd asdsadasdsa a dasdsad
							</p>
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
