import { telemetryBrowser } from "@inlang/telemetry"
import { For, createSignal } from "solid-js"
// children get a default style use content for custome style
export function Feedback() {
	const submitFeedback = (reaction: string) => {
		telemetryBrowser.capture("DOCS submitted reaction", {
			reaction,
		})
		setSubmittedFeedback(true)
	}

	// in order good to bad
	const feedbackEmojis = ["🤩", "🙂", "😕", "😥"]

	const [submittedFeedback, setSubmittedFeedback] = createSignal(false)

	return (
		<div class="flex justify-center items-center h-48">
			<div class="flex gap-2 border border-surface-1 py-1 px-3 rounded-full ">
				<p class="no-prose m-1 text-xs text-info">Was this helpful?</p>
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
				class="text-info w-full text-center absolute pt-24 -z-10 opacity-0"
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
