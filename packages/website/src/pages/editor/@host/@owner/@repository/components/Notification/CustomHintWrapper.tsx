import { createSignal } from "solid-js"
import type { JSXElement } from "solid-js"
import type { Notification } from "./NotificationHint.jsx"
import { NotificationPopup } from "./NotificationPopup.jsx"

interface CustomHintWrapperProps {
	notification: Notification
	children: JSXElement
	condition: boolean
}

export const CustomHintWrapper = (props: CustomHintWrapperProps) => {
	const [open, setOpen] = createSignal<boolean>(true)
	// eslint-disable-next-line solid/reactivity

	const handleClose = () => {
		setOpen(false)
	}

	return (
		<div class="relative z-10">
			<div class={open() ? "block" : "hidden"}>
				<NotificationPopup
					notifications={[props.notification]}
					open={
						!props.condition
							? () => {
									return false
							  }
							: open
					}
					offset={44}
					withIcon={false}
					position="top-left"
					handleClose={handleClose}
				/>
			</div>
			{props.children}
		</div>
	)
}
