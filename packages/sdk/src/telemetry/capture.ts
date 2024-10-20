import { ENV_VARIABLES } from "../env-variables/index.js";

/**
 * List of telemetry events for typesafety.
 *
 * - prefix with `SDK` to avoid collisions with other apps
 * - use past tense to indicate that the event is completed
 */
const events = ["SDK loaded project"] as const;

/**
 * Capture an event.
 *
 * - manually calling the PostHog API because the SDKs were not platform angostic (and generally bloated)
 */
export const capture = async (
  event: (typeof events)[number],
  args: {
    projectId: string;
    /**
     * Please use snake_case for property names.
     */
    properties: Record<string, any>;
  },
) => {
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
        event,
        // id is "unknown" because no user information is available
        distinct_id: "unknown",
        properties: {
          $groups: { project: args.projectId },
          ...args.properties,
        },
      }),
    });
  } catch (e) {
    // TODO implement sentry logging
    // do not console.log and avoid exposing internal errors to the user
  }
};
