import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/plugins/")({
  component: () => (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
          Plugins
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl">
          Plugin directory coming soon
        </h1>
        <p className="max-w-2xl text-lg text-gray-700">
          We&apos;re building a curated list of Lix plugins. Check back shortly
          for details on extending your workflow.
        </p>
      </div>
    </main>
  ),
});
