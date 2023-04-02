import { createSignal } from "solid-js"
import { NotificationPopup } from "./NotificationPopup.jsx"

type NotificationType = "info" | "warn" | "error"

export type Notification = {
	notificationTitle: string
	notificationDescription: string
	notificationType: NotificationType
}

interface NotificationHintProps {
	notifications: Array<Notification>
}

export const NotificationHint = (props: NotificationHintProps) => {
	const [open, setOpen] = createSignal(false)
	// eslint-disable-next-line solid/reactivity
	const dominantType: NotificationType = getDominantType(props.notifications)

	return (
		<div
			class="relative w-8 h-8"
			onMouseOver={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
		>
			<NotificationPopup
				notifications={props.notifications}
				open={open}
				offset={44}
				withIcon={true}
				position="bottom-right"
			/>
			<div
				class={
					"rounded w-8 h-8 flex justify-center items-center " + getTypeBasedStyling(dominantType)
				}
			>
				<WarningIcon />
			</div>
		</div>
	)
}

//Functions

const getDominantType = (notifications: Array<Notification>) => {
	let dominantType: NotificationType = "info"
	notifications.map((notification) => {
		if (notification.notificationType === "warn" && dominantType === "info") dominantType = "warn"
		if (notification.notificationType === "error") dominantType = "error"
	})
	return dominantType
}

export const getTypeBasedStyling = (type: "info" | "warn" | "error") => {
	if (type === "warn") {
		return "hover:bg-warning/10 text-warning"
	} else if (type === "error") {
		return "hover:bg-danger/10 text-danger"
	} else {
		return "hover:bg-info/10 text-info"
	}
}

//Icon

export const WarningIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path d="M9 13h2v2H9v-2zm0-8h2v6H9V5zm1-5C4.47 0 0 4.5 0 10A10 10 0 1010 0zm0 18a8 8 0 110-16 8 8 0 010 16z" />
		</svg>
	)
}
