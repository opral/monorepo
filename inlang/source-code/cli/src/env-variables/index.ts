// @ts-expect-error - env variable is set in build step
const buildStepEnv = ENV_DEFINED_IN_BUILD_STEP

/**
 * The env variables are set in the build step.
 */
export const ENV_VARIABLES = {
	PUBLIC_POSTHOG_TOKEN: buildStepEnv.PUBLIC_POSTHOG_TOKEN,
	IS_PRODUCTION: buildStepEnv.IS_PRODUCTION,
}
