import { clone as cloneGitRepository } from "../../services/git";
import { filesystem, normalize } from "./filesystem";
import { Layout } from "./Layout";
import { Layout as RootLayout } from "../index/Layout";
import { createResource, For, Match, Show, Switch } from "solid-js";
import http from "isomorphic-git/http/web";
import { searchParameters, setSearchParameters } from "./state";
import { ClientPageContext } from "../../renderer/types";

export function Page(props: { clientPageContext: ClientPageContext }) {
  setSearchParameters(props.clientPageContext.urlParsed.search);

  const [clone] = createResource(() =>
    cloneGitRepository({
      fs: filesystem,
      dir: "/",
      http,
      url: "https://github.com/inlang/demo",
      corsProxy: "http://localhost:3001",
      onAuth: () => ({
        headers: {
          Authorization: `Bearer CORS PROXY INJECTS JWT TOKEN FOR DEMO PURPOSES`,
        },
      }),
    })
  );

  const [fileExplorer] = createResource(
    // depends on clone
    clone,
    async () => {
      const paths = await filesystem.promises.readdir(searchParameters.dir);
      // not using filter because async
      const dirs: { path: string; isDirectory: boolean }[] = [];
      for (const subpath of paths) {
        // skipping .dot files and directories
        if (subpath.at(0) === ".") {
          continue;
        }
        const stat = await filesystem.promises.stat(
          normalize(searchParameters.dir + subpath) + "/"
        );
        // if (stat.isDirectory()) {
        dirs.push({ path: subpath, isDirectory: stat.isDirectory() });
        // }
      }
      return dirs;
    }
  );

  return (
    <RootLayout>
      <Layout>
        <Switch>
          <Match when={clone.loading}>
            <div class="absolute inset-0 w-full h-full flex flex-col items-center justify-center backdrop-blur z-50">
              <h1 class="display-md">Cloning repository...</h1>
            </div>
          </Match>
          <Match when={clone().isErr}>
            <div class="alert alert-error">
              <h1 class="alert-title">Something went wrong.</h1>
            </div>
          </Match>
        </Switch>
        <ol class="rounded border divide-y">
          <h3 class="title-md px-4 py-3 bg-surface-100">File explorer</h3>
          <Show when={fileExplorer()}>
            {(element) => (
              <For each={element}>
                {({ path, isDirectory }) => (
                  <li class="px-4 py-2">
                    <Switch>
                      <Match when={isDirectory}>
                        <a
                          class="link"
                          href={`/git/https://github.com/inlang/demo?dir=${
                            searchParameters.dir + path
                          }/`}
                        >
                          <sl-icon prop:name="folder-fill" class="mr-2" />
                          {path}
                        </a>
                      </Match>
                      <Match when={isDirectory === false}>
                        <>
                          <sl-icon prop:name="file-text-fill" class="mr-2" />
                          {path}
                        </>
                      </Match>
                    </Switch>
                    <Show when={path.includes("inlang.config.json")}>
                      <sl-tag
                        prop:variant="success"
                        prop:size="small"
                        class="ml-2"
                      >
                        Configuration found
                      </sl-tag>
                    </Show>
                  </li>
                )}
              </For>
            )}
          </Show>
        </ol>
      </Layout>
    </RootLayout>
  );
}
