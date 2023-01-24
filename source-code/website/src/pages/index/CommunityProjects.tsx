import { For } from "solid-js";
import { repositories } from "./repositories.js";
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward";

export function CommunityProjects() {
  return (
    <div>
      {/* START repository grid */}
      <h2 class="text-xl font-medium pt-6 pb-1">Community projects</h2>
      <p class="pb-2">
        Inlang is a great tool that helps communities translate their projects
        by easing contributions.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4 w-full auto-rows-min">
        <For each={repositories}>
          {(repository) => <RepositoryCard repository={repository} />}
        </For>
        <AddRepositoryCard />
      </div>
      {/* END repository grid */}
    </div>
  );
}

/**
 * A card that displays a repository.
 */
function RepositoryCard(props: { repository: (typeof repositories)[number] }) {
  const isExampleRepository = () =>
    props.repository.owner === "inlang" &&
    props.repository.repository === "example";

  return (
    <div
      class={`rounded border p-4 flex flex-col justify-between gap-5 ${
        isExampleRepository()
          ? "border-secondary bg-secondary-container text-on-secondary-container"
          : "border-outline"
      }`}
    >
      <div>
        <div class="flex items-center justify-between gap-2">
          <p class="font-medium">
            {props.repository.owner}/{props.repository.repository}
          </p>
          <img
            class="w-8 h-8 rounded-sm"
            src={`https://github.com/${props.repository.owner}.png?size=40`}
          />
        </div>
        <p class="pt-3">{props.repository.description}</p>
      </div>
      <a
        href={`/editor/github.com/${props.repository.owner}/${props.repository.repository}`}
      >
        <sl-button
          class="w-full"
          prop:variant={isExampleRepository() ? "neutral" : undefined}
        >
          Open
        </sl-button>
      </a>
    </div>
  );
}

/**
 * Prompting the user to add their repository.
 */
function AddRepositoryCard() {
  return (
    <div
      class={`rounded border p-4 flex flex-col justify-between gap-6 border-info text-on-info-container bg-info-container`}
    >
      {/* empty div to achieve justify-between effect whereas the p is centered */}
      <div />
      <p>Get more contributions by adding your repository to this list.</p>
      <a
        href="https://github.com/inlang/inlang/tree/main/source-code/website/src/pages/editor/repositories.ts"
        target="_blank"
      >
        {/* @ts-ignore By accident, the button looks really cool without a variant in this case. */}
        <sl-button class="w-full" prop:variant="">
          Add your community
          <MaterialSymbolsArrowOutward slot="suffix" />
        </sl-button>
      </a>
    </div>
  );
}
