import { Icon } from "./Icon.jsx"

/**
 * Displays a small banner on top of the navigation.
 */
export function Banner(props: { text: string; href: string; customClasses?: string }) {
	return (
		<a href={props.href} class="w-full group" target={props.href.includes("http") ? "_blank" : ""}>
			<div class="w-full py-1 px-2 transition-all bg-gradient-to-r from-[#BBCFF3] via-[#0BB5D4] to-[#3590ED]">
				<p
					class={`text-sm group-hover:opacity-80 transition-opacity px-2 py-2 rounded-full w-full max-w-xl mx-auto text-background font-medium ${props.customClasses}`}
				>
					{props.text}
					<Icon class="ml-2 w-4 h-4 inline-block" name="external" />
				</p>
			</div>
		</a>
	)
}
