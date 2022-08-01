import type { RequestHandler } from '@sveltejs/kit';
import type { User } from '$lib/stores/user';
import { getServerSideEnv } from './_serverSideEnv';
import cookie from 'cookie';
import { createSecretKey } from 'crypto';
import jose from 'jose';

/**
 * Github OAuth callback
 *
 * Read about the authorization flow here https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
 */
export const get: RequestHandler = async (event) => {
	// getting the short lived code from the url parameters
	const code = event.url.searchParams.get('code');
	const env = getServerSideEnv();
	if (code === null) {
		return {
			status: 500,
			body: `Status 500: The code parameter in the url is missing.\n\nAre you coming from GitHub? If yes, please file a bug report. \n\nIf you are a developer, read GitHubs docs\nhttps://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github
			`
		};
	} else if (
		env.GITHUB_OAUTH_CLIENT_SECRET === undefined ||
		env.VITE_GITHUB_OAUTH_CLIENT_ID === undefined ||
		env.JWT_SECRET_KEY === undefined
	) {
		return {
			status: 500,
			body: `Status 500: At least one env variable "GITHUB_OAUTH_CLIENT_SECRET", "VITE_GITHUB_OAUTH_CLIENT_ID", "JWT_SECRET_KEY" is missing.`
		};
	}
	// exchanging the short lived code for an access token
	const accessTokenResponse = await (
		await fetch(
			`https://github.com/login/oauth/access_token?client_id=${env.VITE_GITHUB_OAUTH_CLIENT_ID}&client_secret=${env.GITHUB_OAUTH_CLIENT_SECRET}&code=${code}`,
			{
				method: 'POST',
				headers: {
					Accept: 'application/json'
				}
			}
		)
	).json();
	if (accessTokenResponse.error) {
		return {
			status: 500,
			//  stringify with tabs inserted at each level
			body: JSON.stringify(accessTokenResponse, undefined, '\t')
		};
	}
	// getting additional user information like name, email from github
	// this information is required to make git commits.
	const userInformation = await (
		await fetch('https://api.github.com/user', {
			method: 'GET',
			headers: {
				Authorization: `token ${accessTokenResponse.access_token}`
			}
		})
	).json();
	// if the user email is private, it won't be returned by the previous
	// api request. Thus, make a dedicated email request.
	const userEmails: [{ email: string; primary: boolean }] = await (
		await fetch('https://api.github.com/user/emails', {
			method: 'GET',
			headers: {
				Authorization: `token ${accessTokenResponse.access_token}`
			}
		})
	).json();
	// a user can have multiple emails. Find the primary email.
	const primaryEmail = userEmails.find((email) => email.primary);
	if (primaryEmail === undefined) {
		return {
			status: 500,
			body: `Status 500: No primary email for the user found.`
		};
	}
	// sign the jwt.
	const jwtSigningKey = createSecretKey(env.JWT_SECRET_KEY, 'base64');
	const jwt = await new jose.SignJWT({ accessTokenJwt: accessTokenResponse.access_token })
		.setProtectedHeader({ alg: 'HS256' })
		.sign(jwtSigningKey);
	// create the user object
	const user: User = {
		email: primaryEmail.email,
		accessTokenJwt: jwt,
		name: userInformation.name
	};
	// transform the user object to a cookie
	const userCookie = cookie.serialize('user', JSON.stringify(user), {
		// expires: new Date(Date.now() + 60 * 60 * 1000),
		path: '/',
		secure: true
	});
	// redirect the client and set the user cookie
	return {
		status: 303,
		headers: {
			location: `/`,
			'set-cookie': [userCookie]
		}
	};
};
