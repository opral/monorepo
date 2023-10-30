import { createSignal } from "solid-js"
import { showToast } from "./Toast.jsx"
import { rpc } from "@inlang/rpc"
import * as m from "@inlang/paraglide-js/inlang-marketplace/messages"

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
					message: m.newsletter_error_alreadySubscribed(),
				})
			} else if (response.data === "success") {
				showToast({
					title: "Success",
					variant: "success",
					message: m.newsletter_success(),
				})
			} else {
				showToast({
					title: "Error",
					variant: "danger",
					message: m.newsletter_error_generic(),
				})
			}
		} else {
			showToast({
				title: "Error",
				variant: "danger",
				message: m.newsletter_error_generic(),
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
				message: m.newsletter_error_emptyEmail(), //t("newsletter.error.emptyEmail"),
			})
			return
		} else if (checkEmail(emailValue) === "invalid") {
			showToast({
				title: "Error",
				variant: "danger",
				message: m.newsletter_error_invalidEmail(), //t("newsletter.error.invalidEmail"),
			})
			return
		}

		fetchSubscriber(emailValue)
	}

	return (
		<div class="flex flex-col items-start justify-center w-full">
			<p class="text-surface-800 text-sm font-semibold mb-3">{m.newsletter_title()}</p>
			<div
				class={
					"flex items-start justify-stretch gap-3 w-full md:flex-row flex-col transition-opacity duration-150 " +
					(loading() ? "opacity-70 cursor-not-allowed" : "")
				}
			>
				<input
					class={
						"p-0 md:w-[312px] w-full text-sm h-10 rounded-[4px] transition-colors focus:outline-primary/50 focus:-outline-offset-0 focus:ring-0 focus:border-primary px-4 border border-surface-300 " +
						(loading() ? "pointer-events-none" : "")
					}
					placeholder={m.newsletter_placeholder()}
					value={email()}
					onInput={(event) => {
						// @ts-ignore
						setEmail(event.target.value)
					}}
					onPaste={(event) => {
						// @ts-ignore
						setEmail(event.target.value)
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							handleSubscribe()
						}
					}}
				/>
				<button
					class={
						"h-10 text-sm text-background px-4 bg-surface-800 hover:bg-surface-900 max-md:w-full rounded-[4px] font-medium transition-all duration-200 " +
						(loading() ? "pointer-events-none" : "")
					}
					onClick={handleSubscribe}
				>
					{m.newsletter_button()}
				</button>
			</div>
		</div>
	)
}
