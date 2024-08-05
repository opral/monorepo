import type { LixPlugin } from "@lix-js/sdk";
import { Bundle, Message, Variant } from "../schema/schemaV2.js";

export const lixPluginV1: LixPlugin<{
	bundle: Bundle;
	message: Message;
	variant: Variant;
}> = {
	key: "inlang-lix-plugin-v1",
	// @ts-expect-error - api does not exist in lix yet
	// idea:
	//   1. runtime reflection for lix on the change schema
	//   2. lix can validate the changes based on the schema
	schema: {
		bundle: Bundle,
		message: Message,
		variant: Variant,
	},
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
		variant: () => {
			throw new Error("Not implemented");
		},
	},
};
