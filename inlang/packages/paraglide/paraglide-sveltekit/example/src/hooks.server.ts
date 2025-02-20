import type { Handle } from '@sveltejs/kit';
import * as paraglide from '$lib/paraglide/runtime';

export const handle: Handle = ({ event, resolve }) => {
	return paraglide.serverMiddleware(event.request, () => resolve(event));
};
