// The purpose of the file is the folling:
//  1. Typesafety with env files
//  2. Default env variables to run this app locally without an env file

type ClientSideEnvironmentVariables = {
	VITE_IS_DEVELOPMENT: boolean;
	VITE_PUBLIC_AUTH_REDIRECT_URL: string;
	VITE_PUBLIC_SUPABASE_ANON_KEY: string;
	VITE_PUBLIC_SUPABASE_URL: string;
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
		? (import.meta.env.VITE_PUBLIC_AUTH_REDIRECT_URL as string)
		: 'http://localhost:3000',
	VITE_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
		? (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string)
		: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt20nEV9cklpv9e3yw3PVyZLmKs5qLD6nGL1SI',
	VITE_PUBLIC_SUPABASE_URL: import.meta.env.VITE_PUBLIC_SUPABASE_URL
		? (import.meta.env.VITE_PUBLIC_SUPABASE_URL as string)
		: 'http://localhost:54321'
};
