/**
 * List of telemetry events for typesafety.
 *
 * - prefix with `SDK` to avoid collisions with other apps
 * - use past tense to indicate that the event is completed
 */
const events = ["SDK loaded project"] as const

/**
 * Capture an event.
 *
 * - manually calling the PostHog API because the SDKs were not platform angostic (and generally bloated)
 */
export const capture = async (
	event: (typeof events)[number],
	args: {
		projectId: string
		/**
		 * Please use snake_case for property names.
		 */
		properties: Record<string, any>
	}
) => {
	try {
		await fetch("https://eu.posthog.com/capture/", {
			method: "POST",
			body: JSON.stringify({
        // TODO env variable injection
				api_key: "<KEY>",
				event,
				distinct_id: "unknown",
				properties: {
					$group: { project: args.projectId },
					...args.properties,
				},
			}),
		})
	} catch (e) {
		// TODO implement sentry logging
		// do not console.log and avoid exposing internal errors to the user
	}
}
