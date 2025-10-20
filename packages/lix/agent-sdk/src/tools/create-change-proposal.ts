import type { Lix } from "@lix-js/sdk";
import { createChangeProposal } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";
import dedent from "dedent";

export const CreateChangeProposalInputSchema = z
	.object({
		sourceVersionId: z.string().min(1).optional(),
		source_version_id: z.string().min(1).optional(),
		targetVersionId: z.string().min(1).optional(),
		target_version_id: z.string().min(1).optional(),
	})
	.refine(
		(v) =>
			(v.sourceVersionId || v.source_version_id) &&
			(v.targetVersionId || v.target_version_id),
		{
			message: "Provide 'source_version_id' and 'target_version_id'",
		}
	);
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

export async function createChangeProposalToolExec(args: {
	lix: Lix;
	input: CreateChangeProposalInput;
}): Promise<CreateChangeProposalOutput> {
	const { lix, input } = args;

	const sourceVersionId = input.sourceVersionId ?? input.source_version_id;
	const targetVersionId = input.targetVersionId ?? input.target_version_id;
	if (!sourceVersionId || !targetVersionId) {
		throw new Error(
			"create_change_proposal: provide source_version_id and target_version_id"
		);
	}

	const exec = async (trx: Lix["db"]) => {
		const source = await trx
			.selectFrom("version")
			.where("id", "=", sourceVersionId as any)
			.select(["id"])
			.executeTakeFirst();
		if (!source) {
			throw new Error(
				`create_change_proposal: source version ${sourceVersionId} not found`
			);
		}

		// Resolve target version (defaults to main if not provided)
		const target = await trx
			.selectFrom("version")
			.where("id", "=", targetVersionId as any)
			.select(["id"])
			.executeTakeFirst();
		if (!target) {
			throw new Error(
				`create_change_proposal: target version ${targetVersionId} not found`
			);
		}

		// Idempotency: if an open proposal already exists for this source→target,
		// return it instead of creating a duplicate.
		const existing = await trx
			.selectFrom("change_proposal")
			.where("source_version_id", "=", source.id as any)
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
			err.sourceVersionId = source.id;
			err.targetVersionId = target.id;
			throw err;
		}

		const proposal = await createChangeProposal({
			lix: { ...lix, db: trx },
			source: { id: source.id },
			target: { id: target.id },
		});

		return CreateChangeProposalOutputSchema.parse({
			id: proposal.id,
			sourceVersionId: source.id,
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

      Provide both source_version_id (where your edits live) and
      target_version_id (where the proposal should merge).

      Returns { id, sourceVersionId, targetVersionId, status }.
    `,
		inputSchema: CreateChangeProposalInputSchema,
		execute: async (input) => {
			const parsedInput = CreateChangeProposalInputSchema.parse(input);
			const result = await createChangeProposalToolExec({
				lix: args.lix,
				input: parsedInput,
			});
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
