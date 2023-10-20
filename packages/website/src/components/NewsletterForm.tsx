import { createSignal } from "solid-js"
import { showToast } from "./Toast.jsx"
import { rpc } from "@inlang/rpc"

export function NewsletterForm() {
	const [email, setEmail] = createSignal("")
	const [loading, setLoading] = createSignal(false)

	const fetchSubscriber = async (email: any) => {
		setLoading(true)
		const response = await rpc.subscribeNewsletter({ email })
		if (!response.error) {
			if (response.data === "already subscribed") {
				showToast({
					title: "Could not subscribe",
					variant: "success",
					message: "You are already subscribed to our newsletter.", //t("newsletter.error.alreadySubscribed"),
				})
			} else if (response.data === "success") {
				showToast({
					title: "Success",
					variant: "success",
					message: "Thank you for subscribing!", //t("newsletter.success"),
				})
			} else {
				showToast({
					title: "Error",
					variant: "danger",
					message: "Something went wrong. Please try again later.", //t("newsletter.error.generic"),
				})
			}
		} else {
			showToast({
				title: "Error",
				variant: "danger",
				message: "Something went wrong. Please try again later.", //t("newsletter.error.generic"),
			})
		}

		setLoading(false)
		setEmail("")
	}

	function handleSubscribe() {
		if (loading()) return

		function checkEmail(email: any) {
			const re = /\S+@\S+\.\S+/

			if (email.trim() === "") {
				return "empty"
			} else if (!re.test(email)) {
				return "invalid"
			} else {
				return "valid"
			}
		}

		const emailValue = email()
		if (checkEmail(emailValue) === "empty") {
			showToast({
				title: "Error",
				variant: "danger",
				message: "Please enter your email address.", //t("newsletter.error.emptyEmail"),
			})
			return
		} else if (checkEmail(emailValue) === "invalid") {
			showToast({
				title: "Error",
				variant: "danger",
				message: "Please enter a valid email address.", //t("newsletter.error.invalidEmail"),
			})
			return
		}

		fetchSubscriber(emailValue)
	}

	return (
		<div class="flex flex-col items-start justify-center w-full">
			<p class="text-surface-800 font-semibold mb-3">Newsletter</p>
			<div
				class={
					"flex items-start justify-stretch gap-3 w-full md:flex-row flex-col transition-opacity duration-150 " +
					(loading() ? "opacity-70 cursor-not-allowed" : "")
				}
			>
				<sl-input
					class={"border-none p-0 md:w-[312px] w-full " + (loading() ? "pointer-events-none" : "")}
					prop:size={"medium"}
					prop:placeholder="Enter your email..."
					// @ts-ignore
					value={email()}
					onInput={(event) => {
						// @ts-ignore
						setEmail(event.target.value)
					}}
					onPaste={(event) => {
						// @ts-ignore
						setEmail(event.target.value)
					}}
					// on enter press
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							handleSubscribe()
						}
					}}
				/>
				<button
					class={
						"h-10 text-sm text-background px-4 bg-surface-700 hover:bg-surface-800 max-md:w-full rounded-md font-medium transition-all duration-200 " +
						(loading() ? "pointer-events-none" : "")
					}
					onClick={handleSubscribe}
				>
					{/* {t("newsletter.button")} */}
					Subscribe
				</button>
			</div>
		</div>
	)
}
