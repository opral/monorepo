import { createFileRoute } from "@tanstack/react-router";
import { FileSchema } from "@inlang/plugin-message-format/file-schema";

export const Route = createFileRoute("/schema/inlang-message-format")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json(FileSchema);
      },
    },
  },
});
