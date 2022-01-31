// The purpose of the file is the folling:
//  1. Typesafety with env files
//  2. Default env variables to run this app locally without an env file

type ClientSideEnvironmentVariables = {
	VITE_IS_DEVELOPMENT: boolean;
	VITE_PUBLIC_AUTH_REDIRECT_URL: string;
	VITE_PUBLIC_SUPABASE_ANON_KEY: string;
	VITE_PUBLIC_SUPABASE_URL: string;
	// if undefined -> no analytics
	VITE_PUBLIC_POSTHOG_TOKEN: string | undefined;
	VITE_PUBLIC_POSTHOG_API_HOST: string | undefined;
};

/**
 * Client side env varibales.
 *
 * Defaults to the local environment variables if no env file
 * with the provided variables exists.
 */
export const env: ClientSideEnvironmentVariables = {
	VITE_IS_DEVELOPMENT: import.meta.env.DEV,
	VITE_PUBLIC_AUTH_REDIRECT_URL: import.meta.env.VITE_PUBLIC_AUTH_REDIRECT_URL
		? import.meta.env.VITE_PUBLIC_AUTH_REDIRECT_URL.toString()
		: 'http://localhost:3000',
	VITE_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
		? import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY.toString()
		: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt20nEV9cklpv9e3yw3PVyZLmKs5qLD6nGL1SI',
	VITE_PUBLIC_SUPABASE_URL: import.meta.env.VITE_PUBLIC_SUPABASE_URL
		? import.meta.env.VITE_PUBLIC_SUPABASE_URL.toString()
		: 'http://localhost:54321',
	VITE_PUBLIC_POSTHOG_TOKEN: import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN?.toString(),
	VITE_PUBLIC_POSTHOG_API_HOST: import.meta.env.VITE_PUBLIC_POSTHOG_API_HOST?.toString()
};
