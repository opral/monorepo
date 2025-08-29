import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useKeyValue } from "@/key-value/use-key-value";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LeftSidebarProvider, useLeftSidebar } from "@/components/left-sidebar";
import { LeftSidebarFiles } from "@/components/left-sidebar-files";
import { LeftSidebarHistory } from "@/components/left-sidebar-history";
import { LeftSidebarTab } from "@/components/left-sidebar-tab";
import { FormattingToolbar } from "@/components/formatting-toolbar";
import { ChangeIndicator } from "@/components/change-indicator";

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
	const { active, setActive } = useLeftSidebar();
	if (!active) return null;

	const handleClose = () => {
		setActive(null);
	};

	return (
		<div className="w-72 shrink-0 border-r bg-background">
			{active === "files" && (
				<LeftSidebarTab title="Files" onClose={handleClose}>
					<LeftSidebarFiles />
				</LeftSidebarTab>
			)}
			{active === "history" && (
				<LeftSidebarTab title="Checkpoints" onClose={handleClose}>
					<LeftSidebarHistory />
				</LeftSidebarTab>
			)}
		</div>
	);
}

function Root() {
	const [activeFileId] = useKeyValue("flashtype_active_file_id");
	return (
		<LeftSidebarProvider>
			<SidebarProvider defaultOpen={false} enableKeyboardShortcut={false}>
				<AppSidebar />
				<SidebarInset>
					<header className="flex h-12 items-center gap-2 border-b px-4 pt-1">
						<div className="font-medium">{activeFileId ?? "Flashtype"}</div>
						<div className="ml-auto">
							<ChangeIndicator />
						</div>
					</header>
					<div className="flex min-h-0 flex-1">
						<LeftSidebarArea />
						<div className="flex min-h-0 flex-1 flex-col text-sm">
							<FormattingToolbar />
							<div className="flex-1 overflow-auto p-4">
								<Outlet />
							</div>
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
