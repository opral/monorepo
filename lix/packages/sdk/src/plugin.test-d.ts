// @ts-nocheck
// TODO implement this test

import type { LixPlugin } from "./plugin.js"

type Types = {
	bundle: { id: string; name: string }
	message: { id: string; color: string }
	variant: { id: string; day: string }
}

const x: LixPlugin<Types> = {
	key: "inlang-lix-plugin-v1",
	glob: "*",
	diff: {
		file: () => {
			throw new Error("Not implemented")
		},
		bundle: ({ old, neu }) => {
			// expect old and neu to be of type Types["bundle"]
			old satisfies Types["bundle"]
			neu satisfies Types["bundle"]
			throw new Error("Not implemented")
		},
		message: ({ old, neu }) => {
			// expect old and neu to be of type Types["message"]
			old satisfies Types["message"]
			neu satisfies Types["message"]
			throw new Error("Not implemented")
		},
		variant: ({ old, neu }) => {
			// expect old and neu to be of type Types["variant"]
			old satisfies Types["variant"]
			neu satisfies Types["variant"]
			throw new Error("Not implemented")
		},
	},
}
