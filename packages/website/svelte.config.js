import adapter from "@sveltejs/adapter-auto";
import preprocess from "svelte-preprocess";
import { mdsvex } from "mdsvex";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: [".svelte", ".svx", ".md"],
	preprocess: [preprocess(), mdsvex()],

	kit: {
		adapter: adapter(),
	},
};

export default config;
