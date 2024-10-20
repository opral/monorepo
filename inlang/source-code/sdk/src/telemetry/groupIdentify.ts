import { ENV_VARIABLES } from "../env-variables/index.js";

/**
 * Capture an event.
 *
 * - manually calling the PostHog API because the SDKs were not platform angostic (and generally bloated)
 */
export const identifyProject = async (args: {
  projectId: string;
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
        // id is "unknown" because no user information is available
        distinct_id: "unknown",
        properties: {
          $group_type: "project",
          $group_key: args.projectId,
          $group_set: {
            ...args.properties,
          },
        },
      }),
    });
  } catch (e) {
    // TODO implement sentry logging
    // do not console.log and avoid exposing internal errors to the user
  }
};
