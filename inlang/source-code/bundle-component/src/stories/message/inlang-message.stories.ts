import "./inlang-message.ts"
import "./../variant/inlang-variant.ts"
import "./../pattern-editor/inlang-pattern-editor.ts"
import "./../inlang-bundle.ts"

import type { Meta, StoryObj } from "@storybook/web-components"
//@ts-ignore
import { useArgs } from "@storybook/preview-api"
import { html } from "lit"
import { Message, pluralBundle, Variant } from "@inlang/sdk2"
import { mockSettings } from "./../../mock/settings.ts"
import { type DispatchChangeInterface } from "../../helper/event.ts"

const meta: Meta = {
	component: "inlang-message",
	title: "Public/inlang-message",
	argTypes: {
		message: { control: "object" }, // Control the variant object through Storybook
	},
}

export default meta

let bufferMessage = structuredClone(pluralBundle.messages[1])

export const Example: StoryObj = {
	args: {
		message: pluralBundle.messages[1],
		settings: mockSettings,
	},
	render: () => {
		const [{ message, settings }, updateArgs] = useArgs()
		const handleChange = (e) => {
			const data = e.detail.argument as DispatchChangeInterface
			const newMessage = structuredClone(bufferMessage)
			switch (data.type) {
				case "Message":
					if (!data.newData) break
					newMessage["selectors"] = (data.newData as Message).selectors
					newMessage["declarations"] = (data.newData as Message).declarations
					break
				case "Variant":
					if (data.operation === "delete") {
						// delete variant
						newMessage.variants = newMessage.variants.filter((v) => v.id !== data.newData!.id)
					} else if (data.newData) {
						const index = newMessage.variants.findIndex((v) => v.id === data.newData!.id)
						if (index === -1) {
							// create new variant
							newMessage.variants.push(data.newData as Variant)
						} else {
							// update variant
							newMessage.variants[index] = data.newData as Variant
						}
					}
					break
			}
			bufferMessage = newMessage
			updateArgs({ message: newMessage })
			console.info(data.type, data.operation, data.newData)
		}

		return html`<inlang-message .message=${message} .settings=${settings} @change=${handleChange}>
			${message.variants.map((variant) => {
				return html`<inlang-variant slot="variant" .variant=${variant}>
                    <inlang-pattern-editor slot="pattern-editor" .variant="${variant}">
                </inlang-variant>`
			})}
		</inlang-message>`
	},
}

export const MessageInBundle: StoryObj = {
	args: {
		message: pluralBundle.messages[1],
		settings: mockSettings,
	},
	render: () => {
		const [{ message, settings }, updateArgs] = useArgs()
		const handleChange = (e) => {
			const data = e.detail.argument as DispatchChangeInterface
			const newMessage = structuredClone(bufferMessage)
			switch (data.type) {
				case "Message":
					if (!data.newData) break
					newMessage["selectors"] = (data.newData as Message).selectors
					newMessage["declarations"] = (data.newData as Message).declarations
					break
				case "Variant":
					if (data.operation === "delete") {
						// delete variant
						newMessage.variants = newMessage.variants.filter((v) => v.id !== data.newData!.id)
					} else if (data.newData) {
						const index = newMessage.variants.findIndex((v) => v.id === data.newData!.id)
						if (index === -1) {
							// create new variant
							newMessage.variants.push(data.newData as Variant)
						} else {
							// update variant
							newMessage.variants[index] = data.newData as Variant
						}
					}
					break
			}
			bufferMessage = newMessage
			updateArgs({ message: newMessage })
			console.info(data.type, data.operation, data.newData)
		}

		return html`<inlang-bundle .bundle=${pluralBundle}>
			<inlang-message
				slot="message"
				.message=${message}
				.settings=${settings}
				@change=${handleChange}
			>
				${message.variants.map((variant) => {
					return html`<inlang-variant slot="variant" .variant=${variant}>
                    <inlang-pattern-editor slot="pattern-editor" .variant="${variant}">
                </inlang-variant>`
				})}
			</inlang-message>
		</inlang-bundle>`
	},
}
