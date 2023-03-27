import type { Accessor } from "solid-js"
import { createSignal, For } from "solid-js"

type NotificationType = "info" | "warning" | "error"

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
			<NotificationTip notifications={props.notifications} open={open} />
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

//ToolTip

interface NotificationTipProps {
	notifications: Array<Notification>
	open: Accessor<boolean>
}

const NotificationTip = (props: NotificationTipProps) => {
	return (
		<div
			class={
				"pointer-events-none absolute w-[300px] bg-inverted-surface bottom-11 right-0 rounded transition duration-20 " +
				(props.open() ? "opacity-100" : "translate-y-0.5 opacity-0")
			}
		>
			<For each={props.notifications}>
				{(notification) => (
					<div
						class={
							"flex gap-2 px-4 py-3 items-center " +
							getTypeBasedColor(notification.notificationType)
						}
					>
						<div class="w-5">
							<WarningIcon />
						</div>
						<p class="grow border-b border-background/10 text-sm last:border-b-0">
							<span>{notification.notificationTitle + "  "}</span>
							<span class="text-on-inverted-surface text-xs">
								{notification.notificationDescription}
							</span>
						</p>
					</div>
				)}
			</For>
			<div class="relative w-full h-0 text-inverted-surface">
				<div class="before:content-['▼'] h-2 flex items-center justify-end px-2" />
			</div>
		</div>
	)
}

//Functions

const getDominantType = (notifications: Array<Notification>) => {
	let dominantType: NotificationType = "info"
	notifications.map((notification) => {
		if (notification.notificationType === "warning" && dominantType === "info")
			dominantType = "warning"
		if (notification.notificationType === "error") dominantType = "error"
	})
	return dominantType
}

const getTypeBasedStyling = (type: "info" | "warning" | "error") => {
	if (type === "warning") {
		return "hover:bg-warning/10 text-warning"
	} else if (type === "error") {
		return "hover:bg-danger/10 text-danger"
	} else {
		return "hover:bg-info/10 text-info"
	}
}

const getTypeBasedColor = (type: "info" | "warning" | "error") => {
	if (type === "warning") {
		return "text-warning-on-inverted-container"
	} else if (type === "error") {
		return "text-danger-on-inverted-container"
	} else {
		return "text-info-on-inverted-container"
	}
}

//Icon

const WarningIcon = () => {
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
