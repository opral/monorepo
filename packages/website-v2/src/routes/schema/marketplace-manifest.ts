import { createFileRoute } from "@tanstack/react-router";
import { MarketplaceManifest } from "@inlang/marketplace-manifest";

export const Route = createFileRoute("/schema/marketplace-manifest")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json(MarketplaceManifest);
      },
    },
  },
});
