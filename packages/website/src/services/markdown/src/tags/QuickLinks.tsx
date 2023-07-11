import { Icon, type AvailableIcon } from "@src/components/Icon.jsx"
import Nextjs from "@src/pages/index/sections/02-integration/assets/nextjs.jsx"
import Svelte from "@src/pages/index/sections/02-integration/assets/svelte.jsx"
import Vuejs from "@src/pages/index/sections/02-integration/assets/vuejs.jsx"
import Reactjs from "@src/pages/index/sections/02-integration/assets/reactjs.jsx"
import Nuxt from "@src/pages/index/sections/02-integration/assets/nuxt.jsx"
import { JSXElement, Show } from "solid-js"

type BrandLogo = "next" | "vue" | "react" | "svelte" | "nuxt"

export function QuickLinks(props: { children: JSXElement[] }) {
	return (
		<div
			class={
				"not-prose my-12 grid grid-cols-1 gap-6 " +
				((props.children as JSXElement[]).length === 2 && " sm:grid-cols-2 ") +
				((props.children as JSXElement[]).length === 3 && " sm:grid-cols-3 ") +
				((props.children as JSXElement[]).length === 4 && " sm:grid-cols-4 ")
			}
		>
			{props.children}
		</div>
	)
}

export function QuickLink(props: {
	title: string
	description: string
	href: string
	icon?: AvailableIcon
	logo?: BrandLogo
}) {
	return (
		<div class="group relative rounded-xl bg-surface-100 hover:bg-surface-200  hover:transition-colors duration-200">
			<div class="relative overflow-hidden rounded-lg p-6">
				<div class="bg-hover-info/10 w-fit p-2 rounded-lg">
					<Show when={props.icon}>
						<Icon name={props.icon!} class="h-6 w-6 text-info" />
					</Show>
					<Show when={props.logo}>
						<Show when={props.logo === "svelte"}>
							<Svelte size={28} startColor="#434343" endColor="#434343" />
						</Show>
						<Show when={props.logo === "next"}>
							<Nextjs size={28} startColor="#434343" endColor="#434343" />
						</Show>
						<Show when={props.logo === "vue"}>
							<Vuejs size={28} startColor="#434343" endColor="#434343" />
						</Show>
						<Show when={props.logo === "nuxt"}>
							<Nuxt size={28} startColor="#434343" endColor="#434343" />
						</Show>
						<Show when={props.logo === "react"}>
							<Reactjs size={28} startColor="#434343" endColor="#434343" />
						</Show>
					</Show>
				</div>

				<h2 class="mt-4 text-base font-medium text-active-info">
					<a href={props.href}>
						<span class="absolute -inset-px rounded-xl" />
						{props.title}
					</a>
				</h2>
				<Show when={props.description}>
					<p class="mt-1 text-sm">{props.description}</p>
				</Show>
			</div>
		</div>
	)
}
