import type { LixPlugin } from "@lix-js/sdk";
import { Bundle, Message, Variant } from "../schema/schemaV2.js";

export const lixPluginV1: LixPlugin<{
	bundle: Bundle;
	message: Message;
	variant: Variant;
}> = {
	key: "inlang-lix-plugin-v1",
	glob: "*",
	// TODO
	// idea:
	//   1. runtime reflection for lix on the change schema
	//   2. lix can validate the changes based on the schema
	// schema: {
	// 	bundle: Bundle,
	// 	message: Message,
	// 	variant: Variant,
	// },
	diff: {
		file: () => {
			throw new Error("Not implemented");
		},
		bundle: () => {
			throw new Error("Not implemented");
		},
		message: () => {
			throw new Error("Not implemented");
		},
		variant: ({ old, neu }) => {
			if (old === undefined && neu) {
				return [{ type: "variant", value: neu, meta: {} }];
			} else if (old && neu === undefined) {
				throw new Error(
					"Deletions are not supported yet. https://github.com/opral/monorepo/pull/3043"
				);
			}
			const hasDiff = JSON.stringify(old) !== JSON.stringify(neu);
			if (hasDiff) {
				return [{ type: "variant", value: neu, meta: {} }];
			} else {
				return [];
			}
		},
	},
};
