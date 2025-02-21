import type { Handle } from '@sveltejs/kit';
import { serverMiddleware } from '$lib/paraglide/runtime';

export const handle: Handle = ({ event, resolve }) => {
	return serverMiddleware(event.request, () => resolve(event));
};
