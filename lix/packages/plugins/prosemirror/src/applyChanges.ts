import { type Change, type LixPlugin, type LixReadonly } from "@lix-js/sdk";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	file,
	changes,
}) => {
	return { fileData: new Uint8Array() };
};
