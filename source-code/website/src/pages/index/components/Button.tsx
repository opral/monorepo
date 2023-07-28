import { useI18n } from "@solid-primitives/i18n"
import { defaultLanguage } from "@src/renderer/_default.page.route.js"
import { JSXElement, Show } from "solid-js"
import { navigate } from "vite-plugin-ssr/client/router"

export type buttonType = "primary" | "secondary" | "secondaryOnGray" | "text" | "textPrimary"

const bgColor = (type: buttonType) => {
	switch (type) {
		case "primary":
			return "text-background bg-surface-800 hover:bg-surface-900 px-4"
		case "secondary":
			return "text-surface-800 bg-surface-200 hover:text-surface-900 hover:bg-surface-300 px-4 "
		case "secondaryOnGray":
			return "text-surface-700 bg-background hover:text-surface-900 hover:bg-surface-300 px-4"
		case "text":
			return "text-surface-700 hover:text-primary"
		case "textPrimary":
			return "text-primary-600 hover:text-primary"
		default:
			return "text-surface-700 bg-background hover:text-surface-900 hover:bg-surface-300 px-4"
	}
}

interface ButtonProps {
	children: JSXElement
	type: buttonType
	href?: string
	chevron?: boolean
	function?: () => void
}

export const Button = (props: ButtonProps) => {
	const [, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	return (
		<>
			<Show when={props?.href?.startsWith("/") && !props.function}>
				<button
					onClick={() => {
						props.href && navigate(getLocale() + props.href)
					}}
					class={
						"flex justify-center items-center h-10 relative gap-2 rounded-md flex-grow-0 flex-shrink-0 text-sm font-medium text-left cursor-pointer transition-all duration-200 " +
						bgColor(props.type)
					}
				>
					{props.children}
					<Show when={props.chevron}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
						>
							<path
								d="M5.5 3L10.5 8L5.5 13"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</Show>
				</button>
			</Show>
			<Show when={!props?.href?.startsWith("/") && !props.function}>
				<a href={props.href} target="_blank">
					<div
						class={
							"flex justify-center items-center h-10 relative gap-2 rounded flex-grow-0 flex-shrink-0 text-sm font-medium text-left cursor-pointer " +
							bgColor(props.type)
						}
					>
						{props.children}
						<Show when={props.chevron}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
							>
								<path
									d="M5.5 3L10.5 8L5.5 13"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</Show>
					</div>
				</a>
			</Show>
			<Show when={props.function}>
				<button
					onClick={() => {
						props.function && props.function()
					}}
					class={
						"flex justify-center items-center h-10 relative gap-2 rounded flex-grow-0 flex-shrink-0 text-sm font-medium text-left " +
						bgColor(props.type)
					}
				>
					{props.children}
					<Show when={props.chevron}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
						>
							<path
								d="M5.5 3L10.5 8L5.5 13"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</Show>
				</button>
			</Show>
		</>
	)
}
