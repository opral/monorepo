//generalized event dispatcher

import type { Bundle, Message, Variant } from "@inlang/sdk2"

export type DispatchChangeInterface = {
	type: "Bundle" | "Message" | "Variant"
	operation: "create" | "update" | "delete"
	newData: Bundle | Message | Variant | undefined
	meta?: Record<string, any>
}

export const createChangeEvent = (props: DispatchChangeInterface) => {
	const onChangeEvent = new CustomEvent("change", {
		bubbles: true,
		composed: true,
		detail: {
			argument: {
				type: props.type,
				operation: props.operation,
				newData: props.newData,
				meta: props.meta,
			},
		},
	})
	return onChangeEvent
}
