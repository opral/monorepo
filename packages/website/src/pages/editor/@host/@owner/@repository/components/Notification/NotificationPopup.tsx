import type { Accessor } from "solid-js"
import { For } from "solid-js"
import { Notification, WarningIcon } from "./NotificationHint.jsx"

interface NotificationPopupProps {
	notifications: Array<Notification>
	open: Accessor<boolean>
	offset: number
	withIcon: boolean
	position: "top-left" | "bottom-right"
	handleClose?: () => void
}

export const NotificationPopup = (props: NotificationPopupProps) => {
	return (
		<div
			class={
				"z-30 absolute w-[300px] bg-inverted-surface rounded shadow-xl transition duration-20 " +
				(props.position === "bottom-right" ? "right-0 pointer-events-none " : "left-0 ") +
				(props.open() ? "opacity-100" : "translate-y-0.5 opacity-0")
			}
			style={
				props.position === "bottom-right"
					? { bottom: String(props.offset) + "px" }
					: { top: String(props.offset) + "px" }
			}
		>
			{props.position === "top-left" && (
				<div class="relative w-full h-0 text-inverted-surface -mt-[6px] mb-[6px]">
					<div class="before:content-['▲'] h-2 flex items-center justify-start px-2" />
				</div>
			)}
			<div class="flex flex-row items-center">
				<div class="flex flex-col items-left w-full">
					<For each={props.notifications}>
						{(notification) => (
							<div
								class={
									"grow flex gap-3 px-4 py-3 items-center border-b border-info last:border-none " +
									getTypeBasedColor(notification.notificationType)
								}
							>
								{props.withIcon && (
									<div class="w-5">
										<WarningIcon />
									</div>
								)}
								<div class="flex flex-col gap-1 grow border-b border-background/10 text-sm last:border-b-0">
									<p>{notification.notificationTitle + "  "}</p>
									<p class="text-on-inverted-surface text-xs">
										{notification.notificationDescription}
									</p>
								</div>
							</div>
						)}
					</For>
				</div>
				{props.handleClose && (
					<button
						onClick={() => props.handleClose && props.handleClose()}
						class="flex justify-center items-center h-8 w-8 mr-4 hover:bg-background/10 text-on-inverted-surface rounded-md"
					>
						<CloseIcon />
					</button>
				)}
			</div>

			{props.position === "bottom-right" && (
				<div class="relative w-full h-0 text-inverted-surface">
					<div class="before:content-['▼'] h-2 flex items-center justify-end px-2" />
				</div>
			)}
		</div>
	)
}

const getTypeBasedColor = (type: "info" | "warn" | "error") => {
	if (type === "warn") {
		return "text-warning-on-inverted-container"
	} else if (type === "error") {
		return "text-danger-on-inverted-container"
	} else {
		return "text-info-on-inverted-container"
	}
}

const CloseIcon = () => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 10 10">
			<path
				fill="currentColor"
				d="M5 6.065L1.274 9.79A.721.721 0 01.74 10a.721.721 0 01-.532-.21A.721.721 0 010 9.26c0-.216.07-.393.21-.533L3.934 5 .21 1.274A.721.721 0 010 .74C0 .526.07.35.21.21.348.07.525 0 .74 0c.216 0 .393.07.533.21L5 3.934 8.726.21C8.866.07 9.043 0 9.26 0c.215 0 .392.07.532.21.14.139.209.316.209.531 0 .216-.07.393-.21.533L6.066 5 9.79 8.726c.14.14.209.317.209.533 0 .215-.07.392-.21.532A.721.721 0 019.26 10a.721.721 0 01-.533-.21L5 6.066z"
			/>
		</svg>
	)
}
