import { createSignal } from "solid-js"
import { useI18n } from "@solid-primitives/i18n"
import { showToast } from "#src/components/Toast.jsx"
import * as m from "@inlang/paraglide-js/messages"

export function NewsletterForm() {
	const [t] = useI18n()

	const [email, setEmail] = createSignal("")
	const [loading, setLoading] = createSignal(false)

	const fetchSubscriber = async () => {
		setLoading(true)
		const response = {} as any
		if (response === "already subscribed") {
			showToast({
				title: "Could not subscribe",
				variant: "success",
				message: m.newsletter_error_alreadySubscribed(),
			})
		} else if (response === "success") {
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
				message: t("newsletter.error.emptyEmail"),
			})
			return
		} else if (checkEmail(emailValue) === "invalid") {
			showToast({
				title: "Error",
				variant: "danger",
				message: t("newsletter.error.invalidEmail"),
			})
			return
		}

		fetchSubscriber()
	}

	return (
		<div class="flex flex-col items-start justify-center w-full">
			<p class="text-surface-800 font-semibold mb-3">{}</p>
			<div
				class={
					"flex items-start justify-stretch gap-3 w-full md:flex-row flex-col transition-opacity duration-150 " +
					(loading() ? "opacity-70 cursor-not-allowed" : "")
				}
			>
				<sl-input
					class={"border-none p-0 md:w-[312px] w-full " + (loading() ? "pointer-events-none" : "")}
					prop:size={"medium"}
					prop:placeholder={m.newsletter_placeholder()}
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
					{m.newsletter_button()}
				</button>
			</div>
		</div>
	)
}
