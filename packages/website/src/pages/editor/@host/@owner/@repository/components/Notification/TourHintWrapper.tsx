import type { JSXElement, JSX } from "solid-js"
import { useEditorState } from "../../State.jsx"
import { useLocalStorage } from "@src/services/local-storage/index.js"

export type TourStepId =
	| "github-login"
	| "fork-repository"
	| "default-languages"
	| "missing-message-rule"
	| "textfield"

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
				{() => {
					switch (props.currentId) {
						case "github-login":
							return <GithubLogin />
						case "fork-repository":
							return <ForkRepository />
						case "default-languages":
							return <DefaultLanguages />
						case "missing-message-rule":
							return <MissingMessageRule />
						case "textfield":
							return <Textfield />
					}
				}}
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
					top: offset.y.toString() + "px",
					right: offset.x.toString() + "px",
					bottom: "unset",
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
				"absolute p-3 w-[300px] z-20 rounded-lg bg-inverted-surface shadow-xl text-on-inverted-surface text-xs  " +
				(props.isVisible && localStorage.isFirstUse ? "" : " hidden") +
				(props.position === "top-right" || props.position === "top-left"
					? " animate-fadeInTop"
					: " animate-fadeInBottom")
			}
			style={getPosition(props.position, props.offset) as JSX.CSSProperties}
		>
			{props.children}
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
				<p class="text-sm font-medium text-info-on-inverted-container">Github login</p>
				<p>Login to Github to commit and push.</p>
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
				<p class="text-sm font-medium text-info-on-inverted-container">No access on this repo</p>
				<p>Please fork it to make changes.</p>
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

const DefaultLanguages = () => {
	const { setTourStep, filteredLanguages } = useEditorState()
	return (
		<div class="w-full flex flex-col gap-2">
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/default-languages.svg"
					alt="default-languages"
				/>
			</div>
			<div class="flex items-center justify-between">
				<div class="pt-2 pb-1 px-1 flex flex-col gap-1">
					<p class="text-sm font-medium text-info-on-inverted-container">Language detection</p>
					<p>We filtered by your browser defaults.</p>
				</div>
				<div
					onClick={() =>
						filteredLanguages().length > 0
							? setTourStep("missing-message-rule")
							: setTourStep("textfield")
					}
					class="w-8 h-8 flex justify-center items-center bg-background/10 hover:bg-background/20 rounded-md cursor-pointer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width={2}
						stroke="currentColor"
						class="w-4 h-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
						/>
					</svg>
				</div>
			</div>
		</div>
	)
}

const MissingMessageRule = () => {
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
				<p>Filter by missing message lint rule.</p>
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
