import { writable } from 'svelte/store';
import { persist, cookieStorage } from '@macfja/svelte-persistent-store';

/**
 * User object (for now) corresponds to a github authenticated user.
 *
 * The `accessTokenJwt` is an encrypted github access token and
 * decryped by the cors proxy.
 */
export type User = {
	name: string;
	email: string;
	/**
	 * Access tokens
	 *
	 * Token is encrypted as JWT in oauth-callbacks
	 * and decrypted in the cors proxy server.
	 */
	accessTokenJwt: string;
};

/** For demo purposes. */
const demoUser: User = {
	name: 'unknown',
	email: 'no@email.com',
	// ignored since the cors proxy server injects an access token for the demo
	accessTokenJwt: ''
};

/**
 * User of the application
 *
 * All data is stored in a cookie for persistence.
 */
export const user = persist<User>(writable(demoUser), cookieStorage(), 'user');
