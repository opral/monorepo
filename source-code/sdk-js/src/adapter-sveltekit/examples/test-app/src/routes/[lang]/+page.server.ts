import { initState } from '@inlang/sdk-js/adapter-sveltekit/server';

export const load = () => {
	return { 'page.server.ts': 1 }
}

export const entries = async () => {
	const { languages } = await initState(await import('../../../inlang.config.js'))

	return languages.map(language => ({ lang: language }))
}
