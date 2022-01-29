// The purpose of the file is the folling:
//  1. Typesafety with env files
//  2. Default env variables to run this app locally without an env file

import * as dotenv from 'dotenv';

type ServerSideEnvironmentVariables = {
	VITE_PUBLIC_SUPABASE_URL: string;
	DEEPL_SECRET_KEY: string | undefined;
	SUPABASE_SECRET_KEY: string;
};
/**
 * Server side environment variables.
 *
 * ! DO NOT IMPORT THIS CLIENT SIDE.
 *
 * Defaults to the local environment variables if no env file
 * with the provided variables exists.
 *
 */
// Is a function since dotenv.config can only be called server side
// -> VITE throws an error if `dotenv.config` is called upon importing this file.
export function getServerSideEnv(): ServerSideEnvironmentVariables {
	dotenv.config();
	return {
		VITE_PUBLIC_SUPABASE_URL: process.env['VITE_PUBLIC_SUPABASE_URL'] ?? 'http://localhost:54321',
		DEEPL_SECRET_KEY: process.env['DEEPL_SECRET_KEY'],
		SUPABASE_SECRET_KEY:
			process.env['SUPABASE_SECRET_KEY'] ??
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.M2d2z4SFn5C7HlJlaSLfrzuYim9nbY_XI40uWFN3hEE'
	};
}
