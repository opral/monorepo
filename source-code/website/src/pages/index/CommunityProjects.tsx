import { For } from "solid-js";
import { repositories } from "./repositories.js";
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward";

export function CommunityProjects() {
  return (
    <div>
      {/* START repository grid */}
      <h2 class="text-2xl font-medium pt-6 pb-1">
        Open source projects that use inlang
      </h2>
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
  return (
    <div
      class={`rounded border p-4 flex flex-col justify-between gap-5 border-outline`}
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
          // prop:variant={isExampleRepository() ? "neutral" : undefined}
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
      class={`rounded border p-4 flex flex-col justify-between gap-6 border-secondary bg-secondary-container text-on-secondary-container`}
    >
      {/* empty div to achieve justify-between effect whereas the p is centered */}
      <div />
      <p>Get contributions and grow your open source project.</p>
      <a
        href="https://github.com/inlang/inlang/tree/main/source-code/website/src/pages/editor/repositories.ts"
        target="_blank"
      >
        {/* @ts-ignore By accident, the button looks really cool without a variant in this case. */}
        <sl-button class="w-full" prop:variant="neutral">
          Add your repository
          <MaterialSymbolsArrowOutward slot="suffix" />
        </sl-button>
      </a>
    </div>
  );
}
