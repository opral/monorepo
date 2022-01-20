import { definitions } from "../types/definitions";
import { Resources } from "@inlang/fluent-syntax";
import { Result } from "@inlang/common";
import { SupabaseClient } from "..";
import { adapters } from "@inlang/adapters";

/**
 * Updates all languages in the database of a project and their corresponding files.
 *
 * Make sure that a subscription for the corresponding project is active and depent on the
 * subscription to update the UI (instead of the return type of this function).
 */
// This ugly function is required since the simple database schema of "just save fluent source files"
// entails having no proper api to update the database. The supabase API (builder) can't be used since the
// data is not relational (yet?).
export async function updateResources(args: {
  client: SupabaseClient;
  project: definitions["project"];
  resources: Resources;
}): Promise<Result<void, Error>> {
  const serializedResources = args.resources.serialize({
    adapter: adapters.fluent,
  });
  if (serializedResources.isErr) {
    return Result.err(serializedResources.error);
  }
  const promises = [];
  for (const serializedResource of serializedResources.value) {
    promises.push(
      args.client
        .from<definitions["language"]>("language")
        .update({ file: serializedResource.data })
        .eq("project_id", args.project.id)
        .eq("code", serializedResource.languageCode)
    );
  }
  const responses = await Promise.all(promises);
  const errors = responses.filter((response) => response.error !== null);
  if (errors.length > 0) {
    const message =
      errors.length > 1
        ? `Multiple errors occured: \n${errors
            .map((error) => error.error?.message)
            .reduce((a, b) => a + "\n" + b)}`
        : errors[0].error?.message;
    return Result.err(Error(message));
  }
  return Result.ok(undefined);
}
