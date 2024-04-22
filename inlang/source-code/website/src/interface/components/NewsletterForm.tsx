import * as m from "../../paraglide/messages.js"

export function NewsletterForm() {
	return (
		<div class="flex flex-col items-start justify-center w-full">
			<p class="text-surface-800 text-sm font-semibold mb-3">{m.newsletter_title()}</p>
			<div class="relative overflow-hidden rounded-xl grayscale border border-surface-300 w-full sm:w-auto flex justify-center bg-background">
				<iframe
					src="https://opral.substack.com/embed"
					width="480"
					height="150"
					class=""
					frame-border="0"
				/>
			</div>
		</div>
	)
}
