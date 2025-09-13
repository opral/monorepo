import * as React from "react";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";
import type { ChatMessage as UiMessage } from "./types";
import { LoadingBar } from "./loading-bar";
// Review menu removed in follow-up-first UX
import { useKeyValue } from "@/key-value/use-key-value";
import {
	acceptChangeProposal,
	rejectChangeProposal,
	switchVersion,
	selectVersionDiff,
} from "@lix-js/sdk";
import { ToolRunList } from "./tool-run-list";
import { ProposalReviewBarMock } from "./proposal-review-bar-mock";
import { PromptStack } from "./prompt-stack";
import type { ToolRun } from "./types";
import type { ToolEvent } from "@lix-js/agent";

/**
 * The main terminal-like chat surface for the Lix Agent (mock).
 * No backend calls; it simulates streaming to validate the UX quickly.
 *
 * @example
 * <ChatPanel />
 */
export function ChatPanel() {
	const lix = useLix();
	const {
		messages: agentMsgs,
		send,
		clear,
		pending,
	} = useAgentChat({
		lix,
		system:
			"You are running embedded in an app called 'Flashtype'. Flashtype is a WISIWYG markdown editor that runs in the browser with lix change control.",
	});

	const messages = React.useMemo<UiMessage[]>(() => {
		return agentMsgs.map((m) => ({
			id: m.id,
			role: m.role,
			content: m.content,
			at: undefined,
		}));
	}, [agentMsgs]);

	// Focus management: pressing "/" anywhere inside the panel focuses the input.
	const panelRef = React.useRef<HTMLDivElement>(null);
	const [lastProposalId, setLastProposalId] = React.useState<string | null>(
		null,
	);
	const [toolRuns, setToolRuns] = React.useState<ToolRun[]>([]);
	const [, setDiffOpen] = useKeyValue("flashtype_diff_open", {
		defaultVersionId: "global",
		untracked: true,
	});
	const [diffSource, setDiffSource] = useKeyValue(
		"flashtype_diff_source_version_id",
		{
			defaultVersionId: "global",
			untracked: true,
		},
	);
	// Diff auto-open now only via proposals; legacy pending→diff path removed.

	const onToolEvent = React.useCallback((e: ToolEvent) => {
		setToolRuns((prev) => {
			const next = [...prev];
			if (e.type === "start") {
				next.push({
					id: e.id,
					// Only show tool name; do not surface inputs/outputs
					title: e.name,
					status: "running",
				});
				return next;
			}
			const idx = next.findIndex((r) => r.id === (e as any).id);
			if (idx === -1) return next;
			if (e.type === "finish") {
				next[idx] = {
					...next[idx],
					status: "success",
					// no detail/output in minimal view
				};
			} else if (e.type === "error") {
				next[idx] = {
					...next[idx],
					status: "error",
					// no detail/output in minimal view
				};
			}
			return next;
		});
	}, []);

	// Safe shortcuts: Ctrl/Cmd+1 = Accept, Ctrl/Cmd+2 = Reject (work while typing)
	React.useEffect(() => {
		const el = panelRef.current;
		if (!el) return;
		const onKey = async (e: KeyboardEvent) => {
			if (!lastProposalId) return;
			if (e.key === "Tab") {
				e.preventDefault();
				await handleAcceptReject(0);
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				await handleAcceptReject(1);
				return;
			}
		};
		el.addEventListener("keydown", onKey, { capture: true } as any);
		return () =>
			el.removeEventListener("keydown", onKey, { capture: true } as any);
	}, [lastProposalId]);

	async function handleAcceptReject(idx: 0 | 1) {
		try {
			const id = lastProposalId;
			if (!id) return;
			if (idx === 0) {
				await acceptChangeProposal({ lix, proposal: { id } });
			} else {
				await rejectChangeProposal({ lix, proposal: { id } });
			}
			const main = await lix.db
				.selectFrom("version")
				.where("name", "=", "main")
				.selectAll()
				.limit(1)
				.executeTakeFirst();
			if (main) await switchVersion({ lix, to: main as any });
			await setDiffSource(null as any);
			await setDiffOpen(false as any);
		} finally {
			setLastProposalId(null);
		}
	}

	// Always compute counts text (safe even when no proposal is active)
	const countsText = useProposalCountsText({
		lix,
		diffSource: diffSource as any,
	});

	// below content is managed by PromptStack now

	return (
		<div
			ref={panelRef}
			className="relative flex h-full max-h-full w-full min-h-0 flex-col overflow-hidden text-xs"
		>
			<ChatMessageList messages={messages} />
			{toolRuns.length > 0 ? <ToolRunList runs={toolRuns} /> : null}
			{pending ? <LoadingBar /> : null}
			{
				<>
					{/* Grouped stack: header + input + below */}
					<PromptStack
						header={
							<ProposalReviewBarMock
								embedded
								total={6}
								added={5}
								removed={1}
								onAccept={() => void handleAcceptReject(0)}
								onReject={() => void handleAcceptReject(1)}
							/>
						}
						className="mb-2"
					>
						{({ renderBelow }) => (
							<ChatInput
								variant="flat"
								renderBelow={renderBelow}
								onSend={(v) => {
									if (pending) return;
									// reset per-turn tool runs
									setToolRuns([]);
									void send(v, { onToolEvent })?.then(async (res) => {
										try {
											if (!res || !res.changeProposalId) return;
											// Fetch proposal to resolve source version id
											const cp = await lix.db
												.selectFrom("change_proposal")
												.where("id", "=", String(res.changeProposalId))
												.selectAll()
												.executeTakeFirst();
											if (!cp) return;
											setLastProposalId(String((cp as any).id));
											await setDiffSource(
												String((cp as any).source_version_id) as any,
											);
											await setDiffOpen(true as any);
										} catch {}
									});
								}}
								onCommand={async (cmd) => {
									if (cmd === "clear" || cmd === "reset" || cmd === "new") {
										await clear();
										return;
									}
								}}
								onQueryMentions={React.useCallback(
									async (q: string) => {
										if (q.length === 0) {
											const all = await lix.db
												.selectFrom("file")
												.select(["path"]) // provide stable ordering
												.orderBy("path")
												.limit(10)
												.execute();
											return all.map((r) => String((r as any).path));
										}
										const rows = await lix.db
											.selectFrom("file")
											.where("path", "like", `%${q}%`)
											.select(["path"])
											.orderBy("path")
											.limit(10)
											.execute();
										return rows.map((r) => String((r as any).path));
									},
									[lix.db],
								)}
							/>
						)}
					</PromptStack>
				</>
			}
		</div>
	);
}

function formatToolTitle(name: string, input?: unknown): string {
	try {
		const arg = input == null ? "" : compactJson(input);
		return `${name}(${arg})`;
	} catch {
		return name;
	}
}

function summarizeInput(input?: unknown): string | undefined {
	if (input == null) return undefined;
	const s = compactJson(input);
	return s.length > 64 ? s.slice(0, 61) + "…" : s;
}

function summarizeOutput(output?: unknown): string | undefined {
	if (output == null) return undefined;
	const s = compactJson(output);
	return s.length > 64 ? s.slice(0, 61) + "…" : s;
}

function compactJson(v: unknown): string {
	try {
		return JSON.stringify(v);
	} catch {
		return String(v);
	}
}

function prettyJson(v: unknown): string | undefined {
	try {
		return JSON.stringify(v, null, 2);
	} catch {
		return undefined;
	}
}

function useProposalCountsText({
	lix,
	diffSource,
}: {
	lix: ReturnType<typeof useLix>;
	diffSource: string | null;
}) {
	// Query diffs for the active file between proposal source and main
	const main = useQueryTakeFirst(({ lix }) =>
		lix.db
			.selectFrom("version")
			.where("name", "=", "main")
			.select(["id"])
			.limit(1),
	);
	const diffs = useQuery(({ lix }) => {
		const sourceId = (diffSource as any) ?? "__none__";
		return selectVersionDiff({
			lix,
			source: { id: sourceId },
			target: { id: (main?.id as any) ?? "__none__" },
		})
			.where("diff.status", "!=", "unchanged")
			.where(
				"diff.file_id",
				"=",
				lix.db
					.selectFrom("key_value")
					.where("key", "=", "flashtype_active_file_id")
					.select("value"),
			)
			.selectAll();
	});
	const total = Array.isArray(diffs) ? (diffs as any[]).length : 0;
	const removed = Array.isArray(diffs)
		? (diffs as any[]).filter((d: any) => d.status === "removed").length
		: 0;
	const added = Math.max(0, total - removed);
	return `${total} changes • +${added} −${removed}`;
}

function parseCounts(text: string): {
	total: number;
	added: number;
	removed: number;
} {
	// Expect format: "<total> changes • +<added> −<removed>"
	try {
		const m = /^(\d+)\s+changes\s+•\s+\+(\d+)\s+−(\d+)$/.exec(text.trim());
		if (!m) return { total: 0, added: 0, removed: 0 };
		return {
			total: Number(m[1] || 0),
			added: Number(m[2] || 0),
			removed: Number(m[3] || 0),
		};
	} catch {
		return { total: 0, added: 0, removed: 0 };
	}
}
