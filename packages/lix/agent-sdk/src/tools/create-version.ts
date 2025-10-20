import type { Lix } from "@lix-js/sdk";
import { createVersion } from "@lix-js/sdk";
import { tool } from "ai";
import dedent from "dedent";
import { z } from "zod";

export const CreateVersionInputSchema = z.object({
	id: z.string().min(1).optional(),
	name: z.string().min(1).optional(),
	fromVersionId: z.string().min(1).optional(),
});

export type CreateVersionInput = z.infer<typeof CreateVersionInputSchema>;

export const CreateVersionOutputSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	inheritsFromVersionId: z.string().nullable(),
});

export type CreateVersionOutput = z.infer<typeof CreateVersionOutputSchema>;

export async function createVersionToolExec(args: {
	lix: Lix;
	input: CreateVersionInput;
}): Promise<CreateVersionOutput> {
	const { lix, input } = args;

	const exec = async (trx: Lix["db"]) => {
		let fromOption: { id: string } | undefined;
		if (input.fromVersionId) {
			const from = await trx
				.selectFrom("version")
				.select(["id"])
				.where("id", "=", input.fromVersionId as any)
				.executeTakeFirst();
			if (!from) {
				throw new Error(
					`create_version: fromVersionId ${input.fromVersionId} not found`
				);
			}
			fromOption = { id: from.id as string };
		}

		const created = await createVersion({
			lix: { ...lix, db: trx },
			id: input.id,
			name: input.name,
			from: fromOption,
		});

		return CreateVersionOutputSchema.parse({
			id: created.id,
			name: (created as any)?.name ?? null,
			inheritsFromVersionId: (created as any)?.inherits_from_version_id ?? null,
		});
	};

	if (lix.db.isTransaction) return exec(lix.db);
	return lix.db.transaction().execute(exec);
}

export function createCreateVersionTool(args: { lix: Lix }) {
	return tool({
		description: dedent`
      Create a new version in the lix.

      - Provide name to set a friendly label (optional).
      - Optionally set fromVersionId to branch from a specific version; otherwise
        the current active version is used.

      Returns { id, name, inheritsFromVersionId } for the created version.
    `,
		inputSchema: CreateVersionInputSchema,
		execute: async (input) => {
			const parsed = CreateVersionInputSchema.parse(input);
			return createVersionToolExec({
				lix: args.lix,
				input: parsed,
			});
		},
	});
}
