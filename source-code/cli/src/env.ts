/**
 * Public env variables available during the runtime.
 *
 * The env variables are set in the build step.
 */
export const {
	isProduction,
}: {
	isProduction: boolean
} =
	// @ts-expect-error - defined in the build step
	ENV_DEFINED_IN_BUILD_STEP
