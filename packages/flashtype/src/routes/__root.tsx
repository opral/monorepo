import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import { useKeyValue } from "@/key-value/use-key-value";
import { useQueryTakeFirst } from "@lix-js/react-utils";
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
import { ArrowUpRight, BotMessageSquare, FilePlus } from "lucide-react";
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

	// Local UI state for the Files tab: inline "new file" creator
	const [creatingNewFile, setCreatingNewFile] = useState(false);

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
					<LeftSidebarTab
						title="Files"
						onClose={() => {
							setCreatingNewFile(false);
							handleClose();
						}}
						actions={
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 cursor-pointer"
								onClick={() => setCreatingNewFile(true)}
								aria-label="Create new file"
								title="New file"
							>
								<FilePlus className="h-4 w-4" />
								<span className="sr-only">New</span>
							</Button>
						}
					>
						<LeftSidebarFiles
							creating={creatingNewFile}
							onRequestCloseCreate={() => setCreatingNewFile(false)}
						/>
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
	const activeFile = useQueryTakeFirst(({ lix }) =>
		lix.db
			.selectFrom("file")
			.select(["id", "path"]) // resolve display name from id
			.where("id", "=", activeFileId),
	);

	// Persisted agent chat open state (untracked/global)
	const [agentChatOpenKV, setAgentChatOpenKV] = useKeyValue(
		"flashtype_agent_chat_open",
		{ defaultVersionId: "global", untracked: true },
	);
	const agentChatOpen = !!agentChatOpenKV;
	// Right agent panel width (resizable)
	const [agentChatWidth, setAgentChatWidth] = useState<number>(() => {
		const saved = Number(localStorage.getItem("flashtype_agent_chat_width"));
		return Number.isFinite(saved) && saved >= 280 ? saved : 360;
	});
	useEffect(() => {
		localStorage.setItem("flashtype_agent_chat_width", String(agentChatWidth));
	}, [agentChatWidth]);
	const mainRef = useRef<HTMLDivElement | null>(null);

	/**
	 * Start drag-resizing the agent panel via a vertical separator.
	 * Calculates width from the container's right edge.
	 */
	function startAgentResize(ev: React.MouseEvent<HTMLDivElement>) {
		ev.preventDefault();
		const container = mainRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const min = 280;
		const max = Math.max(480, Math.min(800, Math.floor(rect.width * 0.8)));

		function onMove(e: MouseEvent) {
			const x = e.clientX;
			const next = clamp(rect.right - x, min, max);
			setAgentChatWidth(next);
		}

		function onUp() {
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseup", onUp);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		}

		document.addEventListener("mousemove", onMove);
		document.addEventListener("mouseup", onUp);
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	}

	function clamp(n: number, a: number, b: number) {
		return Math.max(a, Math.min(b, n));
	}
	return (
		<LeftSidebarProvider>
			<SidebarProvider defaultOpen={false} enableKeyboardShortcut={false}>
				<EditorProvider>
					<AppSidebar />
					<SidebarInset>
						<div className="flex min-h-0 flex-1">
							<LeftSidebarArea />
							<div className="flex min-h-0 flex-1 flex-col">
								<header className="flex h-12 min-w-0 items-center gap-2 border-b px-4 pt-1">
									<div className="font-medium text-sm truncate min-w-0">
										{activeFile?.path ?? ""}
									</div>
									<div className="shrink-0">
										<VersionDropdown />
									</div>
									<div className="ml-auto flex items-center gap-2">
										<ChangeIndicator />
										<Button
											aria-label="Open Lix Agent chat"
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0 text-muted-foreground"
											title="Open Lix Agent chat"
											onClick={() => {
												void setAgentChatOpenKV(true);
											}}
										>
											<BotMessageSquare className="h-4 w-4" />
										</Button>
									</div>
								</header>
								<div
									ref={mainRef}
									className="grid min-h-0 min-w-0 flex-1 overflow-hidden"
									style={{
										gridTemplateColumns: agentChatOpen
											? `minmax(0,1fr) 3px ${agentChatWidth}px`
											: "1fr",
									}}
								>
									<div className="flex min-h-0 min-w-0 flex-1 flex-col text-sm">
										<FormattingToolbar />
										<div className="flex-1 overflow-auto p-4">
											<Outlet />
										</div>
									</div>
									{agentChatOpen ? (
										<>
											<div
												onMouseDown={startAgentResize}
												role="separator"
												aria-orientation="vertical"
												aria-label="Resize agent panel"
												className="w-[3px] cursor-col-resize bg-transparent hover:bg-amber-500/30 active:bg-amber-500/40"
											/>
											<div
												className="shrink-0 border-l bg-background flex h-full w-full max-h-full min-h-0 overflow-hidden"
												style={{
													width: agentChatWidth,
													height:
														"calc(100dvh - var(--lix-inspector-offset, 0px) - 3rem)",
												}}
											>
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
													onClose={() => {
														void setAgentChatOpenKV(false);
													}}
												>
													<LixAgentChat />
												</SidebarTab>
											</div>
										</>
									) : null}
								</div>
							</div>
						</div>
					</SidebarInset>
				</EditorProvider>
			</SidebarProvider>
		</LeftSidebarProvider>
	);
}
