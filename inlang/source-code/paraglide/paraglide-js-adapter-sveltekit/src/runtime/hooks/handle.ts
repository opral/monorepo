import type { Handle } from "@sveltejs/kit"

type HandleOptions = {
	langPlaceholder: string
}

export function handle(options: HandleOptions): Handle {
    return ({ resolve, event }) => {
			return resolve(event, {
				transformPageChunk({ html, done }) {
					if (done) return html.replace(options.langPlaceholder, "en")
					return html
				},
			})
		}
}
