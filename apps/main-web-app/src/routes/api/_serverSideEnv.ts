// The purpose of the file is the folling:
//  1. Typesafety with env files
//  2. Default env variables to run this app locally without an env file

import * as dotenv from 'dotenv';

type ServerSideEnvironmentVariables = {
	DEEPL_SECRET_KEY: string | undefined;
	GITHUB_OAUTH_CLIENT_SECRET: string | undefined;
	VITE_GITHUB_OAUTH_CLIENT_ID: string | undefined;
	JWT_SECRET_KEY: string | undefined;
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
		DEEPL_SECRET_KEY: process.env['DEEPL_SECRET_KEY'],
		GITHUB_OAUTH_CLIENT_SECRET: process.env['GITHUB_OAUTH_CLIENT_SECRET'],
		VITE_GITHUB_OAUTH_CLIENT_ID: process.env['VITE_GITHUB_OAUTH_CLIENT_ID'],
		JWT_SECRET_KEY: process.env['JWT_SECRET_KEY']
	};
}
