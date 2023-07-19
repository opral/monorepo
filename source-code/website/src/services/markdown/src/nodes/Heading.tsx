import { JSXElement, Show, createSignal } from "solid-js"
import copy from "clipboard-copy"
import { showToast } from "@src/components/Toast.jsx"

/**
 * Custom Link nodes.
 *
 * @example
 *  [title](href)
 */

export function Heading(props: { level: number; children: JSXElement }) {
	return (
		<Wrapper>
			<Show when={props.level === 1}>
				<h1 class="text-4xl">
					<CopyWrapper>{props.children}</CopyWrapper>
				</h1>
			</Show>
			<Show when={props.level === 2}>
				<h2 class="text-2xl border-t border-surface-3 pt-8 pb-4">
					<CopyWrapper>{props.children}</CopyWrapper>
				</h2>
			</Show>
			<Show when={props.level === 3}>
				<h3 class="text-[19px] pb-2">
					<CopyWrapper>{props.children}</CopyWrapper>
				</h3>
			</Show>
			<Show when={props.level === 4}>
				<h4 class="text-base font-semibold pb-2">
					<CopyWrapper>{props.children}</CopyWrapper>
				</h4>
			</Show>
			<Show when={props.level === 5}>
				<h4 class="text-sm font-semibold pb-2">
					<CopyWrapper>{props.children}</CopyWrapper>
				</h4>
			</Show>
		</Wrapper>
	)
}

const headingStyle = "font-semibold text-active-info"

const Wrapper = (props: { children: JSXElement }) => {
	return <div classList={{ [headingStyle]: true }}>{props.children}</div>
}

const CopyWrapper = (props: { children: JSXElement }) => {
	const [isHovered, setIsHovered] = createSignal(false)
	let element: HTMLDivElement | ((el: HTMLDivElement) => void) | undefined

	return (
		<div
			class="relative cursor-pointer"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			ref={(el) => {
				if (typeof el === "function") {
					element = el
				} else if (el instanceof HTMLDivElement) {
					element = el
				}
			}}
			id={
				props.children
					?.toString()
					.replace(" ", "-")
					.replace("#", "")
					.toLowerCase()
					.includes("native code")
					? typeof element === "object" && element instanceof HTMLDivElement
						? element.innerText
								?.toString()
								.replace("#", "")
								.replaceAll("/", "")
								.replaceAll(/\(.*?\)/g, "")
								.replaceAll(" ", "-")
								.replace(/-$/, "")
								.toLowerCase()
								.trim() // Trim the value to remove any leading/trailing whitespace
						: ""
					: props.children?.toString().replaceAll(" ", "-").toLowerCase()
			}
			onClick={() => {
				if (typeof element === "object" && element instanceof HTMLDivElement) {
					props.children
						?.toString()
						.replace(" ", "-")
						.replace("#", "")
						.toLowerCase()
						.includes("native code")
						? copy(
								("https://" +
									document.location.host +
									document.location.pathname +
									"#" +
									element?.innerText
										?.toString()
										.replaceAll(" ", "-")
										.replaceAll("/", "")
										.replaceAll(/\(.*?\)/g, "")
										.replaceAll("#", "")
										.replace(/-$/, "")
										.toLowerCase()) as string,
						  )
						: copy(
								("https://" +
									document.location.host +
									document.location.pathname +
									"#" +
									props.children
										?.toString()
										.replaceAll(" ", "-")
										.replace(/-$/, "")
										.toLowerCase()) as string,
						  )
				}
				showToast({ variant: "success", title: "Copied link to clipboard", duration: 3000 })
			}}
		>
			{props.children}
			<div
				class={
					"absolute top-0 -left-2 -translate-x-full font-normal transition-colors text-background " +
					(isHovered() && "text-hover-primary")
				}
			>
				#
			</div>
		</div>
	)
}
