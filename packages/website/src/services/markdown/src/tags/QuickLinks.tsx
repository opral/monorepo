import { Icon, type AvailableIcon } from "@src/components/Icon.jsx"
import type { JSXElement } from "solid-js"

export function QuickLinks(props: { children: JSXElement[] }) {
	return (
		<div
			class={
				"not-prose my-12 grid grid-cols-1 gap-6 " +
				((props.children as JSXElement[]).length === 2 && " sm:grid-cols-2 ") +
				((props.children as JSXElement[]).length === 3 && " sm:grid-cols-3 ")
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
	icon: AvailableIcon
}) {
	return (
		<div class="group relative rounded-xl bg-surface-100 hover:bg-surface-200  hover:transition-colors duration-200">
			<div class="relative overflow-hidden rounded-lg p-6">
				<div class="bg-hover-info/10 w-fit p-2 rounded-lg">
					<Icon name={props.icon} class="h-6 w-6 text-info" />
				</div>

				<h2 class="mt-4 text-base font-medium text-active-info">
					<a href={props.href}>
						<span class="absolute -inset-px rounded-xl" />
						{props.title}
					</a>
				</h2>
				<p class="mt-1 text-sm">{props.description}</p>
			</div>
		</div>
	)
}
