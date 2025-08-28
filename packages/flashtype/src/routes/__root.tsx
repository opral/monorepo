import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LeftSidebarProvider, useLeftSidebar } from "@/components/left-sidebar";
import { LeftSidebarFiles } from "@/components/left-sidebar-files";
import { LeftSidebarHistory } from "@/components/left-sidebar-history";
import { LeftSidebarTab } from "@/components/left-sidebar-tab";

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

function LeftSidebarArea() {
	const { active } = useLeftSidebar();
	if (!active) return null;
	return (
		<div className="w-72 shrink-0 border-r bg-background">
			{active === "files" && (
				<LeftSidebarTab title="Files">
					<LeftSidebarFiles />
				</LeftSidebarTab>
			)}
			{active === "history" && (
				<LeftSidebarTab title="Checkpoints">
					<LeftSidebarHistory />
				</LeftSidebarTab>
			)}
		</div>
	);
}

function Root() {
	return (
		<LeftSidebarProvider>
			<SidebarProvider defaultOpen={false} enableKeyboardShortcut={false}>
				<AppSidebar />
				<SidebarInset>
					<header className="flex h-14 items-center gap-2 border-b px-4">
						<div className="font-medium">Flashtype</div>
					</header>
					<div className="flex min-h-0 flex-1">
						<LeftSidebarArea />
						<div className="flex-1 p-4">
							<Outlet />
						</div>
					</div>
					{import.meta.env.DEV ? (
						<TanStackRouterDevtools position="bottom-right" />
					) : null}
				</SidebarInset>
			</SidebarProvider>
		</LeftSidebarProvider>
	);
}
