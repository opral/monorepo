import { readInlangConfig } from "@inlang/core";
import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { filesystem } from "./filesystem";

export const [searchParameters, setSearchParameters] = createStore({
  /** Current directory */
  dir: "/",
});

createEffect(() => {
  console.log({ searchParameters });
});

export const inlangConfig = async () => {
  const ls = await filesystem.promises.readdir(searchParameters.dir);
  if (ls.includes("inlang.config.json")) {
    try {
      const config = (
        await readInlangConfig({
          // @ts-ignore
          fs: filesystem,
          path: searchParameters.dir + "inlang.config.json",
        })
      ).unwrap();
      return config;
    } catch (error) {
      alert((error as Error).message);
    }
  } else {
    // is always defined from the layout. thus, ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    set(undefined);
  }
};

export const [resources, setResources] = createSignal("/");
