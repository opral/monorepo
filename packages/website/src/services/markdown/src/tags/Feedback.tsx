import { telemetryBrowser } from "@inlang/telemetry"
import { createSignal } from "solid-js"
// children get a default style use content for custome style
export function Feedback() {
	const submitFeedback = (e: any) => {
		if (feedback() === e.target.id) {
			setFeedback(undefined)
		} else {
			setFeedback(e.target.id)
		}
		telemetryBrowser.capture("DOCS submitted reaction", {
			page: document.location.href,
			reaction: e.target.id,
		})
	}

	const [feedback, setFeedback] = createSignal<"love-it" | "good" | "ok" | "bad" | undefined>()

	return (
		<>
			<div class="flex justify-center items-center h-48">
				<div class="flex gap-2 border border-surface-1 py-1 px-3 rounded-full ">
					<p class="no-prose m-1 text-xs text-info">Was this helpful?</p>
					<button
						type="submit"
						class={
							"text-xl rounded hover:bg-surface-200 " +
							(feedback() === "love-it" && " bg-surface-200 ")
						}
						id="love-it"
						onClick={(e) => submitFeedback(e)}
					>
						🤩
					</button>
					<button
						type="submit"
						class={
							"text-xl rounded hover:bg-surface-200 " +
							(feedback() === "good" && " bg-surface-200 ")
						}
						id="good"
						onClick={(e) => submitFeedback(e)}
					>
						🙂
					</button>
					<button
						type="submit"
						class={
							"text-xl rounded hover:bg-surface-200 " + (feedback() === "ok" && " bg-surface-200 ")
						}
						id="ok"
						onClick={(e) => submitFeedback(e)}
					>
						😕
					</button>
					<button
						type="submit"
						class={
							"text-xl rounded hover:bg-surface-200 " + (feedback() === "bad" && " bg-surface-200 ")
						}
						id="bad"
						onClick={(e) => submitFeedback(e)}
					>
						😥
					</button>
				</div>
				<div
					class={
						"text-info w-full text-center absolute pt-24 -z-10 opacity-0 " +
						(feedback() !== undefined
							? " opacity-100 animate-fadeInTop "
							: " transition-opacity opacity-0")
					}
				>
					Thank you for your feedback ♥️
				</div>
			</div>
		</>
	)
}
