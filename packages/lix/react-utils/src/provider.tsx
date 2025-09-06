import { createContext, type ReactNode } from "react";
import type { Lix } from "../../sdk/dist/index.js";

export const LixContext = createContext<Lix | null>(null);

export function LixProvider(props: { lix: Lix; children: ReactNode }) {
	return (
		<LixContext.Provider value={props.lix}>
			{props.children}
		</LixContext.Provider>
	);
}
