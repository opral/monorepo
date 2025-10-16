import type { Lix } from "@lix-js/sdk";
import type { LixAgent } from "./create-lix-agent.js";
import { generateText } from "ai";
import { selectWorkingDiff } from "@lix-js/sdk";

/**
 * Summarize the active version's working changes.
 *
 * Queries in one go via joins from active_version → version → commit → change_set_element → change.
 * If a model is provided, generates a concise natural-language summary; otherwise returns a deterministic fallback.
 */
export async function summarizeWorkingChanges(args: {
	agent: LixAgent;
	limit?: number;
}): Promise<{ text: string }> {
	// Diff since checkpoint using SDK helper
	const diff = await selectWorkingDiff({ lix: args.agent.lix })
		.where("diff.status", "!=", "unchanged")
		.leftJoin("change as before", "before.id", "before_change_id")
		.leftJoin("change as after", "after.id", "after_change_id")
		.select([
			"diff.schema_key as schema_key",
			"diff.file_id as file_id",
			"diff.status as status",
			"before.snapshot_content as before_snapshot",
			"after.snapshot_content as after_snapshot",
		])
		.limit(Math.max(1, Math.min(1000, args.limit ?? 200)))
		.execute();

	const prompt = [
		"You are writing a commit message describing the working changes since the last checkpoint in the lix.",
		"IMPORTANT: Output ONLY 1–3 short paragraphs (plain text). No headings, no lists, no code fences, no preamble.",
		"Use neutral, imperative voice (e.g., Add…, Update…, Remove…). Prefer human meaning over schema/IDs.",
		"Algorithm:\n1) Classify each diff row as added / modified / removed.\n2) Merge similar changes.\n3) Keep paragraphs short.",
		"Special cases:\n- If schema_key is 'lix_key_value':\n  • added:     Add key '<key>' = <value>\n  • modified:  Update key '<key>' to <value>\n  • removed:   Remove key '<key>'",
		"Good (plain text):\nAdd onboarding copy to welcome screen.\nUpdate key 'homepage_title' to \"Getting Started\".\nRemove deprecated setting 'legacy_mode'.",
		"Bad:\nHere is a summary of the changes: …\n### Summary\n- Bulleted list …\n``` … ```",
		"Diff:",
		JSON.stringify(diff, null, 2),
	].join("\n\n");
	const res = await generateText({ model: args.agent.model, prompt });
	return { text: res.text };
}
