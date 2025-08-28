import * as React from "react";
import { useKeyValue } from "@/key-value/use-key-value";
import type { ValueOf } from "@/key-value/schema";

export type LeftSidebarTab = ValueOf<"flashtype_left_sidebar_active_tab">;

type Ctx = {
	active: LeftSidebarTab;
	setActive: (tab: LeftSidebarTab) => Promise<void>;
};

const LeftSidebarContext = React.createContext<Ctx | null>(null);

export function LeftSidebarProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [active, setActive] = useKeyValue("flashtype_left_sidebar_active_tab");
	return (
		<LeftSidebarContext.Provider value={{ active, setActive }}>
			{children}
		</LeftSidebarContext.Provider>
	);
}

export function useLeftSidebar() {
	const ctx = React.useContext(LeftSidebarContext);
	if (!ctx)
		throw new Error("useLeftSidebar must be used within LeftSidebarProvider");
	return ctx;
}
