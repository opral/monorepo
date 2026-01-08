import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/c/apps")({
  beforeLoad: () => {
    throw redirect({
      to: "/c/tools",
      statusCode: 301,
    });
  },
});
