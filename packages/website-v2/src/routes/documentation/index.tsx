import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/documentation/")({
  loader: async () => {
    throw redirect({ to: "/docs" });
  },
  component: () => null,
});
