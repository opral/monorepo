import { clone } from "../../services/git";
import { filesystem } from "./filesystem";
import { Layout } from "./Layout";
import { Layout as RootLayout } from "../index/Layout";
import { createResource, Match, Switch } from "solid-js";
import http from "isomorphic-git/http/web";

export function Page() {
  const [data] = createResource(() =>
    clone({
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

  return (
    <RootLayout>
      <Layout>
        <Switch>
          <Match when={data.loading}>
            <div class="absolute inset-0 w-full h-full flex flex-col items-center justify-center backdrop-blur z-50">
              <h1 class="display-md">Cloning repository...</h1>
            </div>
          </Match>
          <Match when={data().isErr}>
            <div class="alert alert-error">
              <h1 class="alert-title">Something went wrong.</h1>
            </div>
          </Match>
        </Switch>
      </Layout>
    </RootLayout>
  );
}
