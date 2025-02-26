import { getStackInfo } from "./stack-detection.js";
import { it as test, expect } from "vitest";

test("detects sveltekit", async () => {
	const SvelteKitPackageJson = JSON.parse(`{
            "name": "@inlang/paraglide-sveltekit-example",
            "version": "0.0.1",
            "private": true,
            "scripts": {
                "_dev": "vite dev",
                "build": "vite build",
                "test": "vite build",
                "preview": "vite preview",
                "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
                "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
            },
            "devDependencies": {
                "@inlang/paraglide-js": "workspace:*",
                "@inlang/paraglide-sveltekit": "workspace:*",
                "@sveltejs/adapter-auto": "^3.0.0",
                "@sveltejs/adapter-static": "^2.0.3",
                "@sveltejs/kit": "^2.4.3",
                "@sveltejs/vite-plugin-svelte": "^3.0.0",
                "mdsvex": "^0.11.0",
                "svelte": "^4.2.7",
                "svelte-check": "^3.6.0",
                "vite": "^5.0.3"
            },
            "type": "module"
        }`);

	const stack = getStackInfo(SvelteKitPackageJson);
	expect(Object.keys(stack.packages)).toEqual([
		"svelte",
		"@sveltejs/kit",
		"vite",
	]);
});
