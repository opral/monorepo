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
				"absolute p-2 w-[300px] z-20 rounded-lg bg-inverted-surface shadow-xl text-on-inverted-surface " +
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
	return <div>Github</div>
}

const ForkRepository = () => {
	return <div>Repo</div>
}

const DefaultLanguages = () => {
	const { setTourStep, filteredLanguages } = useEditorState()
	return (
		<div
			onClick={() =>
				filteredLanguages().length > 0
					? setTourStep("missing-message-rule")
					: setTourStep("textfield")
			}
		>
			Langugae
		</div>
	)
}

const MissingMessageRule = () => {
	return <div>Missing</div>
}

const Textfield = () => {
	return <div>Text</div>
}
