import { type JSXElement, type JSX, Show } from "solid-js"
import { useLocalStorage } from "#src/services/local-storage/index.js"

export type TourStepId =
	| "github-login"
	| "fork-repository"
	| "missing-lint-rules"
	| "missing-translation-rule"
	| "textfield"
	| "none"

export type Position = "top-right" | "top-left" | "bottom-right" | "bottom-left"

type OffsetType = { x: number; y: number }

interface TourHintWrapperProps {
	children: JSXElement
	currentId: TourStepId
	position: Position
	offset: {
		x: number
		y: number
	}
	isVisible: boolean
}

export const TourHintWrapper = (props: TourHintWrapperProps) => {
	return (
		<div class="relative max-content">
			<TourStepWrapper position={props.position} offset={props.offset} isVisible={props.isVisible}>
				<Show when={props.currentId === "github-login"}>
					<GithubLogin />
				</Show>
				<Show when={props.currentId === "fork-repository"}>
					<ForkRepository />
				</Show>
				<Show when={props.currentId === "missing-lint-rules"}>
					<MissingLintRules />
				</Show>
				<Show when={props.currentId === "missing-translation-rule"}>
					<MissingTranslationRule />
				</Show>
				<Show when={props.currentId === "textfield"}>
					<Textfield />
				</Show>
			</TourStepWrapper>
			{props.children}
		</div>
	)
}

const TourStepWrapper = (props: {
	children: JSXElement
	position: Position
	offset: OffsetType
	isVisible: boolean
}) => {
	const getPosition = (position: Position, offset: OffsetType) => {
		switch (position) {
			case "top-right":
				return {
					top: "unset",
					right: offset.x.toString() + "px",
					bottom: offset.y.toString() + "px",
					left: "unset",
				}
			case "top-left":
				return {
					top: "unset",
					right: "unset",
					bottom: offset.y.toString() + "px",
					left: offset.x.toString() + "px",
				}
			case "bottom-right":
				return {
					top: offset.y.toString() + "px",
					right: offset.x.toString() + "px",
					buttom: "unset",
					left: "unset",
				}
			case "bottom-left":
				return {
					top: offset.y.toString() + "px",
					right: "unset",
					bottom: "unset",
					left: offset.x.toString() + "px",
				}
		}
	}
	const [localStorage] = useLocalStorage()
	return (
		<div
			class={
				"absolute p-3 w-[300px] z-[1] rounded-lg bg-inverted-surface shadow-xl text-on-inverted-surface text-xs " +
				(props.isVisible && localStorage.isFirstUse ? "" : " hidden") +
				(props.position === "top-right" || props.position === "top-left"
					? " animate-fadeInTop"
					: " animate-fadeInBottom")
			}
			style={getPosition(props.position, props.offset) as JSX.CSSProperties}
		>
			{(props.position === "bottom-right" || props.position === "bottom-left") && (
				<div class="relative w-full h-0 text-inverted-surface">
					<div
						class={
							(props.position === "bottom-left" ? "justify-start" : "justify-end") +
							" before:content-['▲'] h-2 flex items-center px-2 -translate-y-5 "
						}
					/>
				</div>
			)}
			{props.children}
			{(props.position === "top-right" || props.position === "top-left") && (
				<div class="relative w-full h-0 text-inverted-surface">
					<div
						class={
							(props.position === "top-left" ? "justify-start" : "justify-end") +
							" before:content-['▼'] h-2 flex items-center px-2 translate-y-3"
						}
					/>
				</div>
			)}
		</div>
	)
}

// Tour steps

const GithubLogin = () => {
	const [, setLocalStorage] = useLocalStorage()
	return (
		<div class="w-full flex flex-col gap-2">
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/github-login.svg"
					alt="github-login"
				/>
			</div>
			<div class="pt-2 pb-1 px-1 flex flex-col gap-1">
				<p class="text-sm font-medium text-info-on-inverted-container">GitHub login</p>
				<p>Login to GitHub to commit and push.</p>
				<p
					onClick={() => setLocalStorage("isFirstUse", false)}
					class="cursor-pointer pt-2 text-primary-on-inverted-container"
				>
					Stay in preview
				</p>
			</div>
		</div>
	)
}

const ForkRepository = () => {
	const [, setLocalStorage] = useLocalStorage()
	return (
		<div class="w-full flex flex-col gap-2">
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/fork-repository.svg"
					alt="fork-repository"
				/>
			</div>
			<div class="pt-2 pb-1 px-1 flex flex-col gap-1">
				<p class="text-sm font-medium text-info-on-inverted-container">No access to this repo</p>
				<p>Please use a fork to make changes.</p>
				<p
					onClick={() => setLocalStorage("isFirstUse", false)}
					class="cursor-pointer pt-2 text-primary-on-inverted-container"
				>
					Stay in preview
				</p>
			</div>
		</div>
	)
}

const MissingLintRules = () => {
	return (
		<div class="w-full flex flex-col gap-2">
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/missing-lint-rules.svg"
					alt="missing-message-rule"
				/>
			</div>
			<div class="pt-2 pb-1 px-1 flex flex-col gap-1">
				<p class="text-sm font-medium text-info-on-inverted-container">
					<span class="text-primary-on-inverted-container">Add</span> lint rules to see what’s
					missing
				</p>
				<p>Go to the inlang marketplace and add lint rules.</p>
			</div>
		</div>
	)
}

const MissingTranslationRule = () => {
	return (
		<div class="w-full flex flex-col gap-2">
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/missing-message-rule.svg"
					alt="missing-message-rule"
				/>
			</div>
			<div class="pt-2 pb-1 px-1 flex flex-col gap-1">
				<p class="text-sm font-medium text-info-on-inverted-container">
					<span class="text-primary-on-inverted-container">Click</span> to see what’s missing
				</p>
				<p>Filter by missing translation lint rule.</p>
			</div>
		</div>
	)
}

const Textfield = () => {
	return (
		<div class="w-full flex flex-col gap-2">
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/textfield.svg"
					alt="textfield"
				/>
			</div>
			<div class="pt-2 pb-1 px-1 flex flex-col gap-1">
				<p class="text-sm font-medium text-info-on-inverted-container">
					<span class="text-primary-on-inverted-container">Click</span> in the text field
				</p>
				<p>Click in the input field to edit the translation.</p>
			</div>
		</div>
	)
}
