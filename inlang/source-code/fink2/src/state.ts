import { atom } from "jotai";
import type { loadProjectFromOpfs } from "@inlang/sdk2";

export const projectAtom = atom<
	Awaited<ReturnType<typeof loadProjectFromOpfs>> | undefined
>(undefined);

export const selectedProjectPathAtom = atom<string | undefined>(undefined);

