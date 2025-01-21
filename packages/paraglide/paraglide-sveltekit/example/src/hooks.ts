import { deLocalizedPath } from '$lib/paraglide/runtime';
import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = (request) => deLocalizedPath(request.url.pathname);
