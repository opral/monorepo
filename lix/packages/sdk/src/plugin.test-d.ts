import type { DiffReport, LixPlugin } from "./plugin.js";

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
		bundle: ({ old, neu }) => {
			// expect old and neu to be of type Types["bundle"]
			// @ts-expect-error - TODO
			old satisfies Types["bundle"];
			// @ts-expect-error - TODO
			neu satisfies Types["bundle"];
			throw new Error("Not implemented");
		},
		message: ({ old, neu }) => {
			// expect old and neu to be of type Types["message"]
			// @ts-expect-error - TODO
			old satisfies Types["message"];
			// @ts-expect-error - TODO
			neu satisfies Types["message"];
			throw new Error("Not implemented");
		},
		variant: ({ old, neu }) => {
			// expect old and neu to be of type Types["variant"]
			// @ts-expect-error - TODO
			old satisfies Types["variant"];
			// @ts-expect-error - TODO
			neu satisfies Types["variant"];
			throw new Error("Not implemented");
		},
	},
};

// ------------------- DIFF REPORT -------------------

const diffReport: DiffReport = {} as any;

// expect that old is undefined and neu is defined
if (diffReport.operation === "create") {
	diffReport.old satisfies undefined;
	diffReport.neu satisfies Record<string, any>;
}

// expect that old and neu are both defined
if (diffReport.operation === "update") {
	diffReport.old satisfies Record<string, any>;
	diffReport.neu satisfies Record<string, any>;
}

// expect that neu is undefined and old is defined
if (diffReport.operation === "delete") {
	diffReport.old satisfies Record<string, any>;
	diffReport.neu satisfies undefined;
}
