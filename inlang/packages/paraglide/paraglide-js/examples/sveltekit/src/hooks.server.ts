import type { Handle } from '@sveltejs/kit';
import { serverMiddleware } from '$lib/paraglide/runtime';

export const handle: Handle = ({ event, resolve }) => {
	return serverMiddleware(event.request, ({ request, locale }) =>
		resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) => html.replace('%lang%', locale)
			}
		)
	);
};
