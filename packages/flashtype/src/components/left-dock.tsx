import * as React from "react";
import { useKeyValue } from "@/key-value/use-key-value";
import type { ValueOf } from "@/key-value/schema";

export type LeftDockTab = ValueOf<"flashtype_left_sidebar_active_tab">;

type Ctx = {
	active: LeftDockTab;
	setActive: (tab: LeftDockTab) => Promise<void>;
};

const LeftDockContext = React.createContext<Ctx | null>(null);

export function LeftDockProvider({ children }: { children: React.ReactNode }) {
	const [active, setActive] = useKeyValue("flashtype_left_sidebar_active_tab");
	return (
		<LeftDockContext.Provider value={{ active, setActive }}>
			{children}
		</LeftDockContext.Provider>
	);
}

export function useLeftDock() {
	const ctx = React.useContext(LeftDockContext);
	if (!ctx) throw new Error("useLeftDock must be used within LeftDockProvider");
	return ctx;
}
