import type { EndpointOutput, RequestEvent } from "@sveltejs/kit";
import { createServerSideSupabaseClient } from "./_utils/serverSideServices";
import type { definitions } from "@inlang/database";
import { SerializedResource } from "@inlang/fluent-format-converters";

/**
 * This is a middleware api endpoint for the CLI.
 *
 * API Endpoint exists because supabase has no way to authorize api keys yet.
 */

type RequestBody = {
  // yeah yeah don't put the api key in the body
  // pssst you never saw that
  apiKey: string;
  files: SerializedResource[];
};

export async function post(event: RequestEvent): Promise<EndpointOutput> {
  if (event.request.headers.get("content-type") !== "application/json") {
    return {
      status: 405,
    };
  }
  const supabase = createServerSideSupabaseClient();
  const requestBody = (await event.request.json()) as RequestBody;
  const project = await supabase
    .from<definitions["project"]>("project")
    .select()
    .match({ api_key: requestBody.apiKey })
    .single();
  if (project.error) {
    return {
      status: 500,
      body: "Error retrieving the project.",
    };
  } else if (project.data === null) {
    return {
      status: 404,
      body: "Couldn't find the project. Are you sure that the api key is correct?",
    };
  } else if (requestBody.files.length === 0) {
    return {
      status: 400,
      body: "No files to update have been provided.",
    };
  }
  for (const file of requestBody.files) {
    const languages = await supabase
      .from<definitions["language"]>("language")
      .update({ file: file.data })
      .match({ project_id: project.data.id, code: file.languageCode });
    if (languages.error) {
      return {
        status: 500,
        body: languages.error.message,
      };
    }
  }
  return {
    status: 200,
  };
}
