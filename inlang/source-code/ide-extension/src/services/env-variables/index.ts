type EnvVariables = {
	IS_PRODUCTION?: string
	PUBLIC_POSTHOG_TOKEN?: string
}

export const ENV_VARIABLES: EnvVariables =
	// @ts-expect-error - the env is defined in the build script
	// can be undefined in tests because vitest doesn't invoke the build script
	typeof ENV_DEFINED_IN_BUILD_STEP !== "undefined" && ENV_DEFINED_IN_BUILD_STEP
		? // @ts-expect-error - the env is defined in the build script
			ENV_DEFINED_IN_BUILD_STEP
		: {}
