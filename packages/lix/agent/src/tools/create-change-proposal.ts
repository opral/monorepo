import type { Lix, LixVersion } from "@lix-js/sdk";
import { createChangeProposal } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";
import { ensureAgentVersion } from "../agent-version.js";
import dedent from "dedent";

// No input; always targets the main version
export const CreateChangeProposalInputSchema = z.object({}).optional();
export type CreateChangeProposalInput = z.infer<
	typeof CreateChangeProposalInputSchema
>;

export const CreateChangeProposalOutputSchema = z.object({
	id: z.string(),
	sourceVersionId: z.string(),
	targetVersionId: z.string(),
	status: z.enum(["open", "accepted", "rejected"]).default("open"),
});

export type CreateChangeProposalOutput = z.infer<
	typeof CreateChangeProposalOutputSchema
>;

async function resolveMainVersion(trx: Lix["db"]): Promise<LixVersion> {
	const main = await trx
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.limit(1)
		.executeTakeFirstOrThrow();
	return main as unknown as LixVersion;
}

export async function createChangeProposalToolExec(args: {
	lix: Lix;
}): Promise<CreateChangeProposalOutput> {
	const { lix } = args;

	const exec = async (trx: Lix["db"]) => {
		// Ensure source is the non-hidden agent version
		const agentVersion = await ensureAgentVersion({ ...lix, db: trx });

		// Resolve target version (always main)
		const target = await resolveMainVersion(trx);

		// Idempotency: if an open proposal already exists for this source→target,
		// return it instead of creating a duplicate.
		const existing = await trx
			.selectFrom("change_proposal")
			.where("source_version_id", "=", agentVersion.id as any)
			.where("target_version_id", "=", target.id as any)
			.where("status", "=", "open")
			.selectAll()
			.limit(1)
			.executeTakeFirst();
		if (existing) {
			const msg = `Active proposal already exists for this source→target: ${String(
				existing.id as string
			)}. Continue refining within the current proposal; do not create a new one.`;
			const err: any = new Error(msg);
			err.code = "ACTIVE_PROPOSAL_EXISTS";
			err.proposalId = existing.id;
			err.sourceVersionId = agentVersion.id;
			err.targetVersionId = target.id;
			throw err;
		}

		const proposal = await createChangeProposal({
			lix: { ...lix, db: trx },
			source: { id: agentVersion.id },
			target: { id: target.id },
		});

		return CreateChangeProposalOutputSchema.parse({
			id: proposal.id,
			sourceVersionId: agentVersion.id,
			targetVersionId: target.id,
			status: proposal.status ?? "open",
		});
	};

	if (lix.db.isTransaction) return exec(lix.db);
	return lix.db.transaction().execute(exec);
}

export function createCreateChangeProposalTool(args: {
	lix: Lix;
	onCreated?: (proposal: CreateChangeProposalOutput) => void;
}) {
	return tool({
		description: dedent`
      Finalize a logical unit of work by creating a change proposal.

      Use this after you have completed all file modifications needed to satisfy
      the user's request (a task). You may call write_file and/or delete_file
      multiple times; when the task is complete, call create_change_proposal to
      bundle the changes for review.

      Returns: { id, sourceVersionId, targetVersionId, status }.
    `,
		inputSchema: CreateChangeProposalInputSchema,
		execute: async () => {
			const result = await createChangeProposalToolExec({ lix: args.lix });
			args.onCreated?.(result);
			// Persist active proposal id globally so future turns know proposal mode
			try {
				await args.lix.db
					.insertInto("key_value_all")
					.values({
						key: "lix_agent_active_proposal_id",
						value: result.id,
						lixcol_version_id: "global",
					})
					.execute();
			} catch {
				try {
					await args.lix.db
						.updateTable("key_value_all")
						.set({ value: result.id })
						.where("lixcol_version_id", "=", "global")
						.where("key", "=", "lix_agent_active_proposal_id")
						.execute();
				} catch {}
			}
			return result;
		},
	});
}
