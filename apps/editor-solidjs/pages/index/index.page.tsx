import type { SlDialog } from "@shoelace-style/shoelace";
import { createSignal } from "solid-js";
import { Layout } from "./Layout";
import style from "./index.module.css";

export function Page() {
  /** The demonstration repository. */
  const demoRepository = {
    name: "inlang/demo",
    iconSrc: "https://github.com/inlang.png",
    description: "Try out the inlang editor with the demo repository.",
    stars: 0,
    href: "/git/https://github.com/inlang/demo/in-editor",
  };

  return (
    <Layout>
      <SearchBar></SearchBar>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <sl-card class={`space-y-1 ${style.demoCard}`}>
          <div class="flex justify-between items-center gap-2 ">
            <h2 class="title-md pt-1 demo-card">{demoRepository.name}</h2>
            <img
              class="h-7 w-7"
              src={demoRepository.iconSrc}
              alt="{demoRepository.name} icon"
            />
          </div>
          <h2 class="label-md">
            <sl-icon prop:name="star" />
            {demoRepository.stars}
          </h2>
          <p class="body-md">{demoRepository.description}</p>
          <sl-button
            prop:size="small"
            prop:variant="primary"
            class="pt-3 w-full"
            prop:href={demoRepository.href}
          >
            Open
          </sl-button>
        </sl-card>
      </div>
    </Layout>
  );
}

const [searchValue, setSearchValue] = createSignal("");

function SearchBar() {
  let addProjectDialog: SlDialog;

  return (
    <div class="flex gap-2">
      <sl-input
        prop:placeholder="Search projects"
        prop:size="medium"
        class="w-full"
        onInput={(event) => setSearchValue(event.currentTarget.value)}
      >
        <sl-icon prop:name="search" slot="prefix" />
      </sl-input>
      <sl-button
        class="hidden sm:block"
        onClick={() => {
          addProjectDialog.show();
        }}
      >
        <sl-icon prop:name="plus-circle" slot="prefix" />
        Add project
      </sl-button>
      <sl-dialog ref={addProjectDialog}>
        <h1 slot="label">Add project</h1>
        <p class="body-md">The feature is not implemented yet.</p>
      </sl-dialog>
    </div>
  );
}
