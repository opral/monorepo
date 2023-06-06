import { telemetryBrowser } from "@inlang/telemetry"
// children get a default style use content for custome style
export function Feedback() {
	const submitFeedback = (e: any) => {
		telemetryBrowser.capture("DOCS submitted reaction", {
			page: document.location.href,
			reaction: e.target.id,
		})
	}

	return (
		<div class="flex justify-center items-center h-48">
			<div class="flex gap-2 border border-surface-1 py-1 px-3 rounded-full">
				<p class="no-prose m-1 text-xs text-info">Was this helpful?</p>
				<button type="submit" class="text-xl" id="love-it" onClick={(e) => submitFeedback(e)}>
					🤩
				</button>
				<button type="submit" class="text-xl" id="good" onClick={(e) => submitFeedback(e)}>
					🙂
				</button>
				<button type="submit" class="text-xl" id="ok" onClick={(e) => submitFeedback(e)}>
					😕
				</button>
				<button type="submit" class="text-xl" id="bad" onClick={(e) => submitFeedback(e)}>
					😥
				</button>
			</div>
		</div>
	)
}
