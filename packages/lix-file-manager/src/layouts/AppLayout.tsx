import { SidebarProvider } from "../../components/ui/sidebar.tsx";
import { AppSidebar } from "./Sidebar.tsx";

export function App({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<div className="flex h-screen w-full">
				<AppSidebar />
				<main className="flex-1">{children}</main>
			</div>
		</SidebarProvider>
	);
}
