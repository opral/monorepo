import type { Config } from "vike/types";

export default {
	clientRouting: true,
	hydrationCanBeAborted: true,
	meta: {
		Root: {
			env: { server: true, client: true },
		},
	},
} satisfies Config;
