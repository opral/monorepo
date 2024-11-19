import { useEffect } from "react";
import { SidebarProvider } from "../../components/ui/sidebar.tsx";
import { AppSidebar } from "./Sidebar.tsx";
import { useAtom } from "jotai";
import { withPollingAtom } from "./../state.ts";

export function App({ children }: { children: React.ReactNode }) {
	const [, setPolling] = useAtom(withPollingAtom);

	useEffect(() => {
		const interval = setInterval(() => {
			setPolling(Date.now());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<SidebarProvider>
			<div className="flex h-screen w-full">
				<AppSidebar />
				<main className="flex-1">{children}</main>
			</div>
		</SidebarProvider>
	);
}
