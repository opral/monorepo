// import { ENV_VARIABLES } from "../env-variables/index.js";

import type { ProjectSettings } from "../../json-schema/settings.js";
import { ENV_VARIABLES } from "../env-variables/index.js";

/**
 * List of telemetry events for typesafety.
 *
 * - prefix with `SDK` to avoid collisions with other apps
 * - use past tense to indicate that the event is completed
 */
type TelemetryEvent = "SDK loaded project";

/**
 * Capture an event.
 *
 * - manually calling the PostHog API because the SDKs were not platform angostic (and generally bloated)
 */
export const capture = async (
	event: TelemetryEvent,
	args: {
		projectId: string;
		accountId: string;
		/**
		 * Please use snake_case for property names.
		 */
		properties: Record<string, any>;
		settings: Pick<ProjectSettings, "telemetry">;
	}
) => {
	if (args.settings.telemetry === "off") {
		return;
	} else if (ENV_VARIABLES.PUBLIC_POSTHOG_TOKEN === undefined) {
		return;
	}
	try {
		await fetch("https://eu.posthog.com/capture/", {
			method: "POST",
			body: JSON.stringify({
				api_key: ENV_VARIABLES.PUBLIC_POSTHOG_TOKEN,
				event,
				distinct_id: args.accountId,
				properties: {
					$groups: { project: args.projectId },
					...args.properties,
				},
			}),
		});
		await identifyProject({
			projectId: args.projectId,
			accountId: args.accountId,
			// using the id for now as a name but can be changed in the future
			// we need at least one property to make a project visible in the dashboar
			properties: { name: args.projectId },
		});
	} catch {
		// do nothing
	}
};

/**
 * Identifying a project is needed.
 *
 * Otherwise, the project will not be visible in the PostHog dashboard.
 */
const identifyProject = async (args: {
	projectId: string;
	accountId: string;
	/**
	 * Please use snake_case for property names.
	 */
	properties: Record<string, any>;
}) => {
	// do not send events if the token is not set
	// (assuming this eases testing)
	if (ENV_VARIABLES.PUBLIC_POSTHOG_TOKEN === undefined) {
		return;
	}
	try {
		await fetch("https://eu.posthog.com/capture/", {
			method: "POST",
			body: JSON.stringify({
				api_key: ENV_VARIABLES.PUBLIC_POSTHOG_TOKEN,
				event: "$groupidentify",
				distinct_id: args.accountId,
				properties: {
					$group_type: "project",
					$group_key: args.projectId,
					$group_set: {
						...args.properties,
					},
				},
			}),
		});
	} catch {
		// do nothing
	}
};
