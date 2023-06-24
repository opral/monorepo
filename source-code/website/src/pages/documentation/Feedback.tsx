import { telemetryBrowser } from "@inlang/telemetry"
import { For, createEffect, createSignal } from "solid-js"
// children get a default style use content for custome style
export function Feedback() {
	const submitFeedback = (reaction: string) => {
		telemetryBrowser.capture("DOCS submitted reaction", {
			reaction,
		})
		setSubmittedFeedback(true)
	}

	//* Only two emojis because of https://github.com/inlang/inlang/pull/910#issuecomment-1584832926
	const feedbackEmojis: [string, string] = ["🤩", "😥"]

	const [submittedFeedback, setSubmittedFeedback] = createSignal<boolean>(false)

	createEffect(() => {
		if (submittedFeedback()) {
			setTimeout(() => {
				setSubmittedFeedback(false)
			}, 5000)
		}
	})

	return (
		<div class="relative flex justify-center items-center pt-2 pb-10 sm:pt-10 sm:pb-20">
			<div class="flex border border-surface-1 py-1 px-3 rounded-full items-center">
				<p class="text-sm text-info pr-2">Was this helpful?</p>
				<For each={feedbackEmojis}>
					{(emoji) => (
						<button
							type="submit"
							class="text-xl rounded hover:bg-surface-200 px-1"
							disabled={submittedFeedback() === true}
							onClick={() => submitFeedback(emoji)}
						>
							{emoji}
						</button>
					)}
				</For>
			</div>
			<div
				class="text-info w-full text-sm text-center absolute pt-24 -z-10 opacity-0"
				classList={{
					"opacity-100 animate-fadeInTop": submittedFeedback(),
					"transition-opacity opacity-0": submittedFeedback() === false,
				}}
			>
				Thank you for your feedback ♥️
			</div>
		</div>
	)
}
