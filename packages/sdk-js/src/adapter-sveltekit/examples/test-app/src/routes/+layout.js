// This file was created by inlang. It is needed in order to circumvent a current limitation of SvelteKit. Please do not delete it (inlang will recreate it if needed).

export const prerender = true

export const load = async ({ data }) => {
	return { ...data, 'layout.js': 1 }
}