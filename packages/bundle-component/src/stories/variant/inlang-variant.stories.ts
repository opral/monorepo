import "./inlang-variant.ts"
import "./../message/inlang-message.ts"
import "./../pattern-editor/inlang-pattern-editor.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
//@ts-ignore
import { useArgs } from "@storybook/preview-api"
import { html } from "lit"
import { pluralBundle, type Variant } from "@inlang/sdk2"
import { type DispatchChangeInterface } from "../../helper/event.ts"

const meta: Meta = {
	component: "inlang-variant",
	title: "Public/inlang-variant",
	argTypes: {
		variant: { control: "object" }, // Control the variant object through Storybook
	},
}

export default meta

export const Example: StoryObj = {
	args: {
		variant: pluralBundle.messages[0].variants[2],
	},
	render: () => {
		const [{ variant }, updateArgs] = useArgs()
		const handleChange = (e) => {
			const data = e.detail.argument as DispatchChangeInterface
			if (data.operation === "delete") {
				// delete variant
				updateArgs({ variant: undefined })
			} else if (data.newData) {
				updateArgs({ variant: data.newData as Variant })
			}
			console.info(data.type, data.operation, data.newData)
		}

		return html`<inlang-variant .variant=${variant} @change=${handleChange}>
			<inlang-pattern-editor slot="pattern-editor" .variant="${variant}"></inlang-pattern-editor>
		</inlang-variant>`
	},
}

export const VariantInMessage: StoryObj = {
	args: {
		variant: pluralBundle.messages[0].variants[2],
	},
	render: () => {
		const [{ variant }, updateArgs] = useArgs()
		const handleChange = (e) => {
			const data = e.detail.argument as DispatchChangeInterface
			if (data.operation === "delete") {
				// delete variant
				updateArgs({ variant: undefined })
			} else if (data.newData) {
				updateArgs({ variant: data.newData as Variant })
			}
			console.info(data.type, data.operation, data.newData)
		}

		return html`<inlang-message>
			<inlang-variant slot="variant" .variant=${variant} @change=${handleChange}>
				<inlang-pattern-editor slot="pattern-editor" .variant="${variant}">
				</inlang-pattern-editor> </inlang-variant
		></inlang-message>`
	},
}
