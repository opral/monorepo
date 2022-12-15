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
		<div class="flex-row min-h-full w-full items-center justify-center mx-auto md:max-w-2xl divide-y divide-solid divide-outline">
			<For each={tableOfContent}>
				{(section) => (
					<div class="py-12">
						<a href={section.href} class="text-ellipsis space-y-4">
							<p class="text-xl font-bold tracking-tight text-on-backround truncate">
								{section.headline}
							</p>
							<p class="">{section.subHeadline}</p>
							<img
								class="object-contain w-full rounded"
								src={section.imageSrc}
							/>
							{/* using link-primary and text-primary to render the link color by default in primary 
							but also get hover effects from link-primary */}
							<p class="link text-primary link-primary">Read more…</p>
						</a>
					</div>
				)}
			</For>
		</div>
	);
}
