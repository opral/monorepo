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
				"absolute p-3 w-[300px] z-20 rounded-lg bg-inverted-surface shadow-xl text-on-inverted-surface text-xs " +
				(props.isVisible && localStorage.isFirstUse ? "" : " hidden")
			}
			style={getPosition(props.position, props.offset) as JSX.CSSProperties}
		>
			{props.children}
		</div>
	)
}

// Tour steps

const GithubLogin = () => {
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
			</div>
		</div>
	)
}

const ForkRepository = () => {
	return (
		<div class="w-full">
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/fork-repository.svg"
					alt="fork-repository"
				/>
				Fork
			</div>
		</div>
	)
}

const DefaultLanguages = () => {
	const { setTourStep, filteredLanguages } = useEditorState()
	return (
		<div
			class="w-full"
			onClick={() =>
				filteredLanguages().length > 0
					? setTourStep("missing-message-rule")
					: setTourStep("textfield")
			}
		>
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/default-languages.svg"
					alt="default-languages"
				/>
				Langugaes
			</div>
		</div>
	)
}

const MissingMessageRule = () => {
	return (
		<div class="w-full">
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/missing-message-rule.svg"
					alt="missing-message-rule"
				/>
				Missing
			</div>
		</div>
	)
}

const Textfield = () => {
	return (
		<div class="w-full">
			<div class="w-full overflow-hidden">
				<img
					class="rounded"
					width="100%"
					src="/images/TourGuideSVGs/textfield.svg"
					alt="textfield"
				/>
				Textfield
			</div>
		</div>
	)
}
