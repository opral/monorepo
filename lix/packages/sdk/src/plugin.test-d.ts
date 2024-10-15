import type { LixPlugin } from "./plugin.js";

type Types = {
	bundle: { id: string; name: string };
	message: { id: string; color: string };
	variant: { id: string; day: string };
};

// ------------------- PLUGIN -------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin: LixPlugin<Types> = {
	key: "inlang-lix-plugin-v1",
	glob: "*",
	diff: {
		file: () => {
			throw new Error("Not implemented");
		},
		bundle: ({ before, after }) => {
			// expect old and neu to be of type Types["bundle"]
			// @ts-expect-error - TODO
			before satisfies Types["bundle"];
			// @ts-expect-error - TODO
			after satisfies Types["bundle"];
			throw new Error("Not implemented");
		},
		message: ({ before, after }) => {
			// expect old and neu to be of type Types["message"]
			// @ts-expect-error - TODO
			before satisfies Types["message"];
			// @ts-expect-error - TODO
			after satisfies Types["message"];
			throw new Error("Not implemented");
		},
		variant: ({ before, after }) => {
			// expect old and neu to be of type Types["variant"]
			// @ts-expect-error - TODO
			before satisfies Types["variant"];
			// @ts-expect-error - TODO
			after satisfies Types["variant"];
			throw new Error("Not implemented");
		},
	},
};
