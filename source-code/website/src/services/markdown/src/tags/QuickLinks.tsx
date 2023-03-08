import { Icon, type AvailableIcon } from "@src/components/Icon.jsx"
import type { JSXElement } from "solid-js"

export function QuickLinks(props: { children: JSXElement }) {
	return <div class="not-prose my-12 grid grid-cols-1 gap-6 sm:grid-cols-2">{props.children}</div>
}

export function QuickLink(props: {
	title: string
	description: string
	href: string
	icon: AvailableIcon
}) {
	return (
		<div class="group relative rounded-xl border border-outline hover:transition-colors duration-200 hover:bg-primary-container hover:border-primary hover:text-on-primary-container">
			<div class="relative overflow-hidden rounded-lg p-6">
				<Icon name={props.icon} class="h-8 w-8" />
				<h2 class="mt-4 text-base font-medium">
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
