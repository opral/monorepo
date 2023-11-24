
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const NX_CLI_SET: string;
	export const NVM_INC: string;
	export const NX_LOAD_DOT_ENV_FILES: string;
	export const NODE_VERSION: string;
	export const TERM_PROGRAM: string;
	export const NODE: string;
	export const NVM_CD_FLAGS: string;
	export const INIT_CWD: string;
	export const npm_package_devDependencies_typescript: string;
	export const SHELL: string;
	export const TERM: string;
	export const npm_package_devDependencies_vite: string;
	export const TMPDIR: string;
	export const npm_config_metrics_registry: string;
	export const npm_config_global_prefix: string;
	export const TERM_PROGRAM_VERSION: string;
	export const MallocNanoZone: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const ZDOTDIR: string;
	export const COLOR: string;
	export const NX_TASK_TARGET_TARGET: string;
	export const npm_package_private: string;
	export const npm_package_devDependencies__sveltejs_kit: string;
	export const npm_config_registry: string;
	export const npm_config_local_prefix: string;
	export const SESSION_COOKIE_SECRET: string;
	export const NVM_DIR: string;
	export const USER: string;
	export const ALGOLIA_APPLICATION: string;
	export const npm_package_scripts_check_watch: string;
	export const COMMAND_MODE: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const npm_package_devDependencies__inlang_paraglide_js: string;
	export const npm_config_globalconfig: string;
	export const NX_TASK_HASH: string;
	export const OPEN_AI_KEY: string;
	export const DOPPLER_PROJECT: string;
	export const SSH_AUTH_SOCK: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_package_devDependencies_tslib: string;
	export const npm_execpath: string;
	export const npm_package_devDependencies_svelte: string;
	export const npm_config_frozen_lockfile: string;
	export const NX_TASK_TARGET_PROJECT: string;
	export const PATH: string;
	export const NX_WORKSPACE_ROOT: string;
	export const USER_ZDOTDIR: string;
	export const __CFBundleIdentifier: string;
	export const npm_config_userconfig: string;
	export const npm_config_init_module: string;
	export const PWD: string;
	export const npm_command: string;
	export const npm_package_scripts_preview: string;
	export const EDITOR: string;
	export const GOOGLE_TRANSLATE_API_KEY: string;
	export const npm_lifecycle_event: string;
	export const LANG: string;
	export const npm_package_name: string;
	export const NODE_PATH: string;
	export const npm_package_scripts_build: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const XPC_FLAGS: string;
	export const FORCE_COLOR: string;
	export const DOPPLER_ENVIRONMENT: string;
	export const npm_config_node_gyp: string;
	export const XPC_SERVICE_NAME: string;
	export const npm_package_version: string;
	export const npm_package_devDependencies__sveltejs_adapter_auto: string;
	export const VSCODE_INJECTION: string;
	export const npm_package_devDependencies_svelte_check: string;
	export const HOME: string;
	export const SHLVL: string;
	export const npm_package_type: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const npm_package_scripts_test: string;
	export const npm_package_devDependencies__inlang_plugin_message_format: string;
	export const LOGNAME: string;
	export const npm_config_cache: string;
	export const npm_lifecycle_script: string;
	export const ALGOLIA_ADMIN: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const LERNA_PACKAGE_NAME: string;
	export const NVM_BIN: string;
	export const npm_config_user_agent: string;
	export const DOPPLER_CONFIG: string;
	export const GIT_ASKPASS: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const LIX_GITHUB_APP_CLIENT_SECRET: string;
	export const JWE_SECRET: string;
	export const npm_package_scripts_check: string;
	export const COLORTERM: string;
	export const npm_config_prefix: string;
	export const npm_node_execpath: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://kit.svelte.dev/docs/modules#$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_LIX_GITHUB_APP_NAME: string;
	export const PUBLIC_SERVER_BASE_URL: string;
	export const PUBLIC_GIT_PROXY_BASE_URL: string;
	export const PUBLIC_POSTHOG_TOKEN: string;
	export const PUBLIC_LIX_GITHUB_APP_CLIENT_ID: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) (or running [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		NX_CLI_SET: string;
		NVM_INC: string;
		NX_LOAD_DOT_ENV_FILES: string;
		NODE_VERSION: string;
		TERM_PROGRAM: string;
		NODE: string;
		NVM_CD_FLAGS: string;
		INIT_CWD: string;
		npm_package_devDependencies_typescript: string;
		SHELL: string;
		TERM: string;
		npm_package_devDependencies_vite: string;
		TMPDIR: string;
		npm_config_metrics_registry: string;
		npm_config_global_prefix: string;
		TERM_PROGRAM_VERSION: string;
		MallocNanoZone: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		ZDOTDIR: string;
		COLOR: string;
		NX_TASK_TARGET_TARGET: string;
		npm_package_private: string;
		npm_package_devDependencies__sveltejs_kit: string;
		npm_config_registry: string;
		npm_config_local_prefix: string;
		SESSION_COOKIE_SECRET: string;
		NVM_DIR: string;
		USER: string;
		ALGOLIA_APPLICATION: string;
		npm_package_scripts_check_watch: string;
		COMMAND_MODE: string;
		PNPM_SCRIPT_SRC_DIR: string;
		npm_package_devDependencies__inlang_paraglide_js: string;
		npm_config_globalconfig: string;
		NX_TASK_HASH: string;
		OPEN_AI_KEY: string;
		DOPPLER_PROJECT: string;
		SSH_AUTH_SOCK: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_package_devDependencies_tslib: string;
		npm_execpath: string;
		npm_package_devDependencies_svelte: string;
		npm_config_frozen_lockfile: string;
		NX_TASK_TARGET_PROJECT: string;
		PATH: string;
		NX_WORKSPACE_ROOT: string;
		USER_ZDOTDIR: string;
		__CFBundleIdentifier: string;
		npm_config_userconfig: string;
		npm_config_init_module: string;
		PWD: string;
		npm_command: string;
		npm_package_scripts_preview: string;
		EDITOR: string;
		GOOGLE_TRANSLATE_API_KEY: string;
		npm_lifecycle_event: string;
		LANG: string;
		npm_package_name: string;
		NODE_PATH: string;
		npm_package_scripts_build: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		XPC_FLAGS: string;
		FORCE_COLOR: string;
		DOPPLER_ENVIRONMENT: string;
		npm_config_node_gyp: string;
		XPC_SERVICE_NAME: string;
		npm_package_version: string;
		npm_package_devDependencies__sveltejs_adapter_auto: string;
		VSCODE_INJECTION: string;
		npm_package_devDependencies_svelte_check: string;
		HOME: string;
		SHLVL: string;
		npm_package_type: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		npm_package_scripts_test: string;
		npm_package_devDependencies__inlang_plugin_message_format: string;
		LOGNAME: string;
		npm_config_cache: string;
		npm_lifecycle_script: string;
		ALGOLIA_ADMIN: string;
		VSCODE_GIT_IPC_HANDLE: string;
		LERNA_PACKAGE_NAME: string;
		NVM_BIN: string;
		npm_config_user_agent: string;
		DOPPLER_CONFIG: string;
		GIT_ASKPASS: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		LIX_GITHUB_APP_CLIENT_SECRET: string;
		JWE_SECRET: string;
		npm_package_scripts_check: string;
		COLORTERM: string;
		npm_config_prefix: string;
		npm_node_execpath: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_LIX_GITHUB_APP_NAME: string;
		PUBLIC_SERVER_BASE_URL: string;
		PUBLIC_GIT_PROXY_BASE_URL: string;
		PUBLIC_POSTHOG_TOKEN: string;
		PUBLIC_LIX_GITHUB_APP_CLIENT_ID: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
