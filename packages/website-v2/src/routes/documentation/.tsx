import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/documentation/$slug")({
  loader: async ({ params }) => {
    throw redirect({ to: `/docs/${params.slug}` });
  },
  component: () => null,
});
