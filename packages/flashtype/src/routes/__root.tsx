import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useKeyValue } from "@/key-value/use-key-value";
import { useQueryTakeFirst } from "@lix-js/react-utils";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LeftSidebarProvider, useLeftSidebar } from "@/components/left-sidebar";
import { LeftSidebarFiles } from "@/components/left-sidebar-files";
import { LeftSidebarHistory } from "@/components/left-sidebar-history";
import { LeftSidebarTab } from "@/components/left-sidebar-tab";
import { SidebarTab } from "@/components/sidebar-tab";
import { FormattingToolbar } from "@/components/formatting-toolbar";
import { ChangeIndicator } from "@/components/change-indicator";
import { VersionDropdown } from "@/components/version-dropdown";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BotMessageSquare } from "lucide-react";
import { LixAgentChat } from "@/components/lix-agent-chat";
import { EditorProvider } from "@/editor/editor-context";

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
	const open = !!active;

	const handleClose = () => {
		setActive(null);
	};

	return (
		<div
			data-open={open}
			className="group w-0 data-[open=true]:w-72 transition-[width] duration-200 ease-out shrink-0 border-r data-[open=false]:border-transparent bg-background overflow-hidden"
		>
			<div className="h-full min-h-0 opacity-0 group-data-[open=true]:opacity-100 transition-opacity duration-100">
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
		</div>
	);
}

function Root() {
	const [activeFileId] = useKeyValue("flashtype_active_file_id");
	const activeFile = useQueryTakeFirst((lix) =>
		lix.db
			.selectFrom("file")
			.select(["id", "path"]) // resolve display name from id
			.where("id", "=", activeFileId),
	);

	const [agentChatOpen, setAgentChatOpen] = useState(false);
	return (
		<LeftSidebarProvider>
			<SidebarProvider defaultOpen={false} enableKeyboardShortcut={false}>
				<EditorProvider>
					<AppSidebar />
					<SidebarInset>
						<div className="flex min-h-0 flex-1">
							<LeftSidebarArea />
							<div className="flex min-h-0 flex-1 flex-col">
								<header className="flex h-12 items-center gap-2 border-b px-4 pt-1">
									<div className="font-medium text-sm">
										{activeFile?.path ?? ""}
									</div>
									<VersionDropdown />
									<div className="ml-auto flex items-center gap-2">
										<ChangeIndicator />
										<Button
											aria-label="Open Lix Agent chat"
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0 text-muted-foreground"
											title="Open Lix Agent chat"
											onClick={() => setAgentChatOpen(true)}
										>
											<BotMessageSquare className="h-4 w-4" />
										</Button>
									</div>
								</header>
								<div className="flex min-h-0 flex-1">
									<div className="flex min-h-0 flex-1 flex-col text-sm">
										<FormattingToolbar />
										<div className="flex-1 overflow-auto p-4">
											<Outlet />
										</div>
									</div>
									{agentChatOpen ? (
										<div className="w-72 shrink-0 border-l bg-background">
											<SidebarTab
												title={
													<a
														href="https://github.com/opral/lix-sdk"
														target="_blank"
														rel="noreferrer noopener"
														className="inline-flex items-center gap-1 text-foreground hover:underline"
													>
														Lix Agent <ArrowUpRight className="h-3.5 w-3.5" />
													</a>
												}
												onClose={() => setAgentChatOpen(false)}
											>
												<LixAgentChat />
											</SidebarTab>
										</div>
									) : null}
								</div>
							</div>
						</div>
						{import.meta.env.DEV ? (
							<TanStackRouterDevtools position="bottom-right" />
						) : null}
					</SidebarInset>
				</EditorProvider>
			</SidebarProvider>
		</LeftSidebarProvider>
	);
}
