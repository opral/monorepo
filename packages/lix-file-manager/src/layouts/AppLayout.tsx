import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar.tsx";
import { AppSidebar } from "./Sidebar.tsx";
import { useAtom } from "jotai";
import { withPollingAtom } from "@/state.ts";
import { posthog } from "posthog-js"
export function App({ children }: { children: React.ReactNode }) {
	const [, setPolling] = useAtom(withPollingAtom);

	useEffect(() => {
		const interval = setInterval(() => {
			setPolling(Date.now());
		}, 100);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		posthog.init('phc_OZO78iL2JN2Je1ExWjBGdMxXu06VDwL4QDH9Z7EuUXv', {
			api_host: "https://eu.i.posthog.com",
			capture_performance: false,
			autocapture: {
				capture_copied_text: true,
			},
		})
		posthog.capture("$pageview")
		return () => posthog.reset()
	}, [])

	return (
		<SidebarProvider>
			<div className="flex h-screen w-full">
				<AppSidebar />
				<main className="h-screen flex-1 overflow-hidden">{children}</main>
			</div>
		</SidebarProvider>
	);
}
