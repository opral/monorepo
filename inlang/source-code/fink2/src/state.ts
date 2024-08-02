import { atom } from "jotai";
import type { InlangProject } from "@inlang/sdk2";

export const projectAtom = atom<InlangProject | undefined>(undefined);

export const selectedProjectPathAtom = atom<string | undefined>(undefined);

