import "./inlang-pattern-editor.ts"
import "./../testing/reactivePatternEditorWrapper.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { pluralBundle } from "@inlang/sdk2"
import stringToPattern from "../../helper/crud/pattern/stringToPattern.ts"

const meta: Meta = {
	component: "inlang-pattern-editor",
	title: "Public/inlang-pattern-editor",
}

export default meta

export const Simple: StoryObj = {
	render: () =>
		html`
			<inlang-pattern-editor
				.pattern=${pluralBundle.messages[0].variants[2].pattern}
				@change-pattern=${() => console.log("update")}
			>
			</inlang-pattern-editor>
		`,
}

export const Empty: StoryObj = {
	render: () =>
		html`
			<inlang-pattern-editor
				.pattern=${stringToPattern({ text: "" })}
				@change-pattern=${() => console.log("update")}
			>
			</inlang-pattern-editor>
		`,
}

export const Reactive: StoryObj = {
	render: () =>
		html` <inlang-reactive-pattern-editor-wrapper></inlang-reactive-pattern-editor-wrapper> `,
}
