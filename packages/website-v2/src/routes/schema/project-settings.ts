import { createFileRoute } from "@tanstack/react-router";
import { ProjectSettings } from "@inlang/sdk/settings-schema";

export const Route = createFileRoute("/schema/project-settings")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json(ProjectSettings);
      },
    },
  },
});
