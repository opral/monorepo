import {
	acceptChangeProposal,
	createChangeProposal,
	createVersion,
	rejectChangeProposal,
} from "@lix-js/sdk";
import type { Lix } from "@lix-js/sdk";
import type { LixChangeProposal } from "@lix-js/sdk";
import type { ChangeProposalSummary } from "./types.js";

export type AgentChangeProposalEvent = {
	status: "open" | "accepted" | "rejected" | "cancelled";
	proposal: LixChangeProposal;
	toolCallId: string;
	toolName: string;
	toolInput: Record<string, unknown>;
	conversationId: string;
	messageId: string;
	fileId?: string;
	filePath?: string;
	sourceVersionId?: string;
	targetVersionId?: string;
};

export class ChangeProposalRejectedError extends Error {
	constructor() {
		super("Change proposal rejected");
		this.name = "ChangeProposalRejectedError";
	}
}

type PendingProposalState = {
	proposal: LixChangeProposal;
	result: unknown;
	resolve(value: unknown): void;
	reject(reason?: unknown): void;
	fileId?: string;
	filePath?: string;
	toolCall: RecordedToolCall;
};

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

type ReviewContext = {
	conversationId: string;
	messageId: string;
	onChangeProposal?: (event: AgentChangeProposalEvent) => void;
};

type RecordedToolCall = {
	id: string;
	name: string;
	input: Record<string, unknown>;
};

export class ProposalModeController {
	private pending: PendingProposalState | null = null;
	private context: ReviewContext | null = null;

	constructor(private readonly lix: Lix) {}

	beginTurn(context: ReviewContext): void {
		this.context = context;
		this.pending = null;
	}

	async endTurn(args: { aborted?: boolean } = {}): Promise<void> {
		const state = this.pending;
		if (state) {
			this.pending = null;
			await this.discardPendingProposal(state);
			try {
				state.reject(new ChangeProposalRejectedError());
			} catch {
				// ignore double rejection
			}
			this.emitProposalEvent("cancelled", state);
		}
		this.context = null;
		void args.aborted;
	}

	isActive(): boolean {
		return this.context !== null;
	}

	getPendingSummaries(): ChangeProposalSummary[] {
		if (!this.pending) {
			return [];
		}
		return [this.createSummary(this.pending)];
	}

	hasPending(): boolean {
		return this.pending !== null;
	}

	getPendingSummary(proposalId: string): ChangeProposalSummary | null {
		const state = this.pending;
		if (!state) {
			return null;
		}
		if (state.proposal.id !== proposalId) {
			return null;
		}
		return this.createSummary(state);
	}

	async interceptToolCall<TResult>(args: {
		toolName: string;
		toolCallId?: string;
		toolInput?: Record<string, unknown>;
		executeOriginal: (input: Record<string, unknown>) => Promise<TResult>;
	}): Promise<TResult> {
		const context = this.context;
		if (!context) {
			throw new Error("ProposalModeController is not active");
		}
		if (this.hasPending()) {
			throw new Error("Another change proposal is already pending review");
		}

		const toolCall = this.createRecordedToolCall(args);
		const targetVersionId = String(toolCall.input.version_id ?? "");
		if (!targetVersionId) {
			throw new Error(
				`${args.toolName}: proposalMode requires input.version_id`
			);
		}

		const preChangeInfo = await this.lookupFileInVersion({
			versionId: targetVersionId,
			toolCall,
		});

		const reviewVersion = await createVersion({
			lix: this.lix,
			from: { id: targetVersionId },
		});

		const modifiedInput = {
			...toolCall.input,
			version_id: reviewVersion.id,
		};

		const toolResult = await args.executeOriginal(modifiedInput);

		const proposal = await createChangeProposal({
			lix: this.lix,
			source: { id: reviewVersion.id },
			target: { id: targetVersionId },
		});

		const { fileId, filePath } = await this.resolveFileInfo({
			proposal,
			toolCall,
			reviewVersionId: reviewVersion.id,
		});

		const resultMetadata = this.extractFileMetadataFromResult(toolResult);
		const resolvedFileId =
			fileId ?? preChangeInfo.fileId ?? resultMetadata.fileId ?? undefined;
		const resolvedFilePath =
			filePath ??
			preChangeInfo.filePath ??
			resultMetadata.filePath ??
			undefined;

		const deferred = createDeferred<TResult>();

		this.pending = {
			proposal,
			result: toolResult,
			resolve: deferred.resolve,
			reject: deferred.reject,
			fileId: resolvedFileId,
			filePath: resolvedFilePath,
			toolCall,
		};

		this.emitProposalEvent("open", this.pending);

		return deferred.promise;
	}

	async accept(proposalId?: string): Promise<void> {
		const state = this.getPendingState(proposalId);
		await acceptChangeProposal({
			lix: this.lix,
			proposal: { id: state.proposal.id },
		});
		this.emitProposalEvent("accepted", state);
		this.pending = null;
		state.resolve(state.result);
	}

	async reject(proposalId?: string): Promise<void> {
		const state = this.getPendingState(proposalId);
		await rejectChangeProposal({
			lix: this.lix,
			proposal: { id: state.proposal.id },
		});
		this.emitProposalEvent("rejected", state);
		this.pending = null;
		state.reject(new ChangeProposalRejectedError());
	}

	private emitProposalEvent(
		status: AgentChangeProposalEvent["status"],
		state: PendingProposalState
	): void {
		const context = this.context;
		if (!context?.onChangeProposal) {
			return;
		}
		const { conversationId, messageId } = context;
		const handler = context.onChangeProposal;
		const event: AgentChangeProposalEvent = {
			status,
			proposal: state.proposal,
			toolCallId: state.toolCall.id,
			toolName: state.toolCall.name,
			toolInput: state.toolCall.input,
			conversationId,
			messageId,
			fileId: state.fileId,
			filePath: state.filePath,
			sourceVersionId: state.proposal.source_version_id ?? undefined,
			targetVersionId: state.proposal.target_version_id ?? undefined,
		};
		setTimeout(() => {
			handler?.(event);
		}, 0);
	}

	private async discardPendingProposal(
		state: PendingProposalState
	): Promise<void> {
		const proposalId = String(state.proposal.id);
		await this.lix.db.transaction().execute(async (trx) => {
			await trx
				.deleteFrom("change_proposal_all")
				.where("id", "=", proposalId as any)
				.where("lixcol_version_id", "=", "global")
				.execute();

			const sourceVersionId = state.proposal.source_version_id;
			if (sourceVersionId) {
				await trx
					.deleteFrom("version")
					.where("id", "=", sourceVersionId as any)
					.execute();
			}
		});
	}

	private createSummary(state: PendingProposalState): ChangeProposalSummary {
		const proposalRecord = state.proposal as Record<string, unknown>;
		const title =
			typeof proposalRecord["title"] === "string"
				? (proposalRecord["title"] as string)
				: undefined;
		const summary =
			typeof proposalRecord["summary"] === "string"
				? (proposalRecord["summary"] as string)
				: undefined;
		return {
			id: state.proposal.id,
			source_version_id: state.proposal.source_version_id,
			target_version_id: state.proposal.target_version_id,
			title,
			summary,
			fileId: state.fileId,
			filePath: state.filePath,
		};
	}

	private async resolveFileInfo(args: {
		proposal: LixChangeProposal;
		toolCall: RecordedToolCall;
		reviewVersionId: string;
	}): Promise<{ fileId: string | null; filePath: string | null }> {
		const { proposal, toolCall, reviewVersionId } = args;
		const rawPath = toolCall.input?.path;
		const filePath = typeof rawPath === "string" ? rawPath : null;
		if (!filePath) {
			return { fileId: null, filePath: null };
		}
		const existing = await this.lix.db
			.selectFrom("file_all")
			.where("path", "=", filePath)
			.where("lixcol_version_id", "=", proposal.source_version_id as any)
			.select(["id"])
			.executeTakeFirst();
		if (existing?.id) {
			return { fileId: String(existing.id), filePath };
		}
		const reviewFile = await this.lix.db
			.selectFrom("file_all")
			.where("path", "=", filePath)
			.where("lixcol_version_id", "=", reviewVersionId as any)
			.select(["id"])
			.executeTakeFirst();
		return {
			fileId: reviewFile?.id ? String(reviewFile.id) : null,
			filePath,
		};
	}

	private async lookupFileInVersion(args: {
		versionId: string;
		toolCall: RecordedToolCall;
	}): Promise<{ fileId?: string; filePath?: string }> {
		const { versionId, toolCall } = args;
		const explicitFileId = this.extractFileId(toolCall.input);
		const explicitFilePath = this.extractFilePath(toolCall.input);

		if (!explicitFileId && !explicitFilePath) {
			return {};
		}

		const query = this.lix.db
			.selectFrom("file_all")
			.where("lixcol_version_id", "=", versionId as any)
			.select(["id", "path"]);

		const resolved = explicitFileId
			? await query
					.where("id", "=", explicitFileId as string)
					.executeTakeFirst()
			: await query
					.where("path", "=", explicitFilePath as string)
					.executeTakeFirst();

		if (!resolved) {
			return {
				fileId: explicitFileId ?? undefined,
				filePath: explicitFilePath ?? undefined,
			};
		}

		return {
			fileId: resolved.id ? String(resolved.id) : undefined,
			filePath: typeof resolved.path === "string" ? resolved.path : undefined,
		};
	}

	private createRecordedToolCall(args: {
		toolName: string;
		toolCallId?: string;
		toolInput?: Record<string, unknown>;
	}): RecordedToolCall {
		const input = args.toolInput ? { ...args.toolInput } : {};
		const id =
			typeof args.toolCallId === "string" && args.toolCallId.length > 0
				? args.toolCallId
				: `manual:${args.toolName}:${Date.now()}:${Math.random()
						.toString(36)
						.slice(2)}`;
		return {
			id,
			name: args.toolName,
			input,
		};
	}

	private extractFileMetadataFromResult(result: unknown): {
		fileId?: string;
		filePath?: string;
	} {
		if (!result || typeof result !== "object") {
			return {};
		}
		const record = result as Record<string, unknown>;
		const fileId =
			typeof record.fileId === "string"
				? record.fileId
				: typeof record.file_id === "string"
					? record.file_id
					: undefined;
		const filePath =
			typeof record.filePath === "string"
				? record.filePath
				: typeof record.path === "string"
					? record.path
					: undefined;
		return { fileId, filePath };
	}

	private extractFilePath(input: Record<string, unknown>): string | undefined {
		if (typeof input.path === "string") return input.path;
		if (typeof input.filePath === "string") return input.filePath;
		return undefined;
	}

	private extractFileId(input: Record<string, unknown>): string | undefined {
		if (typeof input.fileId === "string") return input.fileId;
		if (typeof input.file_id === "string") return input.file_id;
		return undefined;
	}

	private getPendingState(proposalId?: string): PendingProposalState {
		const current = this.pending;
		if (!current) {
			throw new Error("No pending change proposals");
		}
		if (proposalId && current.proposal.id !== proposalId) {
			throw new Error(`No pending proposal ${proposalId}`);
		}
		return current;
	}
}
