import { useEffect } from "react";
import { SidebarProvider } from "../../components/ui/sidebar.tsx";
import { AppSidebar } from "./Sidebar.tsx";
import { Provider, useAtom } from "jotai";
import { withPollingAtom } from "./../state.ts";
import { SettingsModal } from "../components/SettingsModal.tsx";
import { useState } from "react";
export function App({ children }: { children: React.ReactNode }) {
	const [, setPolling] = useAtom(withPollingAtom);
	const [settingsOpen, setSettingsOpen] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setPolling(Date.now());
		}, 100);
		return () => clearInterval(interval);
	}, []);

	return (
		<Provider>
			<SidebarProvider>
				<div className="flex h-screen w-full">
					<AppSidebar onSettingsClick={setSettingsOpen} />
					<main className="flex-1">{children}</main>
				</div>
				<SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
			</SidebarProvider>
		</Provider>
	);
}
