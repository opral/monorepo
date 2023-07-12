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

	function generateId(
		element: HTMLDivElement | ((el: HTMLDivElement) => void) | undefined,
		props: { children: JSXElement },
	) {
		const children = props.children
			?.toString()
			.replaceAll(" ", "-")
			.replaceAll("#", "")
			.toLowerCase()

		if (children?.includes("native code")) {
			if (typeof element === "object" && element instanceof HTMLDivElement) {
				return element.innerText
					?.toString()
					.replaceAll(" ", "-")
					.replaceAll("#", "")
					.toLowerCase()
					.trim()
			} else {
				return ""
			}
		} else {
			return children
		}
	}

	function handleClick(
		element: HTMLDivElement | ((el: HTMLDivElement) => void) | undefined,
		props: { children: JSXElement },
	) {
		if (typeof element === "object" && element instanceof HTMLDivElement) {
			const children = props.children
				?.toString()
				.replaceAll(" ", "-")
				.replaceAll("#", "")
				.toLowerCase()

			if (children?.includes("native code")) {
				copy(
					("https://" +
						document.location.host +
						document.location.pathname +
						"#" +
						element?.innerText
							?.toString()
							.replaceAll(" ", "-")
							.replaceAll("#", "")
							.toLowerCase()) as string,
				)
			} else {
				copy(
					("https://" +
						document.location.host +
						document.location.pathname +
						"#" +
						children) as string,
				)
			}
		}
		showToast({ variant: "success", title: "Copy to clipboard", duration: 3000 })
	}

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
			id={generateId(element, props)}
			onClick={() => handleClick(element, props)}
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
