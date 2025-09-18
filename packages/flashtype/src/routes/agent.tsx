import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import AgentChat from "@/components/agent-chat";

export const Route = createFileRoute("/agent")({
	component: AgentPage,
});

function AgentPage() {
	return (
		<main className="h-full p-4">
			<div className="mb-3 text-sm text-neutral-600">Agent Chat</div>
			<div className="h-[65vh] min-h-[360px]">
				<AgentChat />
			</div>
		</main>
	);
}
