import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/documentation/$slug")({
  loader: async ({ params }) => {
    throw redirect({ to: "/docs/$slug", params: { slug: params.slug } });
  },
  component: () => null,
});
