import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LeftDockProvider, useLeftDock } from "@/components/left-dock";
import { LeftDockFiles } from "@/components/left-dock-files";

export const Route = createRootRoute({
	component: Root,
	notFoundComponent: () => (
		<main style={{ maxWidth: 720, margin: "48px auto", padding: "0 16px" }}>
			<h1 style={{ fontSize: 28, marginBottom: 8 }}>404 — Not Found</h1>
			<p style={{ color: "#555" }}>
				The page you’re looking for does not exist.
			</p>
		</main>
	),
});

function LeftDockArea() {
	const { active } = useLeftDock();
	if (!active) return null;
	return (
		<div className="w-72 shrink-0 border-r bg-background">
			{active === "files" && (
				<div className="p-2">
					<LeftDockFiles />
				</div>
			)}
			{active === "history" && (
				<div>
					<div className="border-b px-3 py-2 text-sm font-medium">History</div>
					<ul className="p-3 space-y-1 text-sm">
						<li className="rounded-md px-2 py-1">Initial draft</li>
						<li className="rounded-md px-2 py-1">Added introduction</li>
						<li className="rounded-md px-2 py-1">Fixed typos</li>
					</ul>
				</div>
			)}
		</div>
	);
}

function Root() {
	return (
		<LeftDockProvider>
			<SidebarProvider defaultOpen={false} enableKeyboardShortcut={false}>
				<AppSidebar />
				<SidebarInset>
					<header className="flex h-14 items-center gap-2 border-b px-4">
						<div className="font-medium">Flashtype</div>
					</header>
					<div className="flex min-h-0 flex-1">
						<LeftDockArea />
						<div className="flex-1 p-4">
							<Outlet />
						</div>
					</div>
					{import.meta.env.DEV ? (
						<TanStackRouterDevtools position="bottom-right" />
					) : null}
				</SidebarInset>
			</SidebarProvider>
		</LeftDockProvider>
	);
}
