import type { MessageBundle } from "@inlang/sdk/v2"

export const createInput = (props: { messageBundle: MessageBundle; inputName: string }) => {
	console.log("createInput", props.messageBundle, props.inputName)
	for (const message of props.messageBundle.messages) {
		if (message.declarations.some((declaration) => declaration.name === props.inputName)) {
			console.error("Input with name already exists")
			return
		} else {
			message.declarations.push({
				type: "input",
				name: props.inputName,
				value: {
					type: "expression",
					arg: {
						type: "variable",
						name: props.inputName,
					},
				},
			})
		}
	}
}
