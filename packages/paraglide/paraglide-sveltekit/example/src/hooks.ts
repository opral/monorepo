import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = (request) => {
	if (request.url.pathname === '/de') {
		return '/';
	}

	return stripLocaleFromPath(request.url.pathname);
};

function stripLocaleFromPath(path: string) {
	return path.replace(/^\/[a-z]{2}\//, '/');
}
