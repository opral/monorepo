import { createSignal, onMount } from "solid-js";
import { navigate } from "vike/client/router";
import { z } from "zod";
import { CommunityProjects } from "#src/interface/editor/CommunityProjects.jsx";
import { Button } from "#src/interface/components/Button.jsx";
import EditorLayout from "#src/interface/editor/EditorLayout.jsx";
import { currentPageContext } from "#src/renderer/state.js";
import { replaceMetaInfo } from "../@host/@owner/@repository/helper/ReplaceMetaInfo.js";

export default function Page() {
  /** is not reactive because window is not reactive */
  const [input, setInput] = createSignal("");

  const isValidUrl = () =>
    z
      .string()
      .url()
      .regex(/github/)
      .safeParse(input()).success;

  function navigateToEditor(event: Event) {
    event.preventDefault();
    const url = new URL(input());
    // @ts-ignore - https://github.com/brillout/vite-plugin-ssr/issues/1106
    return navigate(`/${url.host}${url.pathname}`);
  }

  onMount(() => {
    onMount(() => {
      replaceMetaInfo(currentPageContext);
    });
  });

  return (
    <>
      <EditorLayout>
        {/* START search bar */}
        <div class="flex flex-col items-center justify-center py-16 md:py-20">
          {/* negative margin as a dirty way of centering the search bar */}
          <div class="flex flex-col p-2 md:p-10 items-center tracking-tight">
            <h2 class="text-[40px] leading-tight md:text-6xl font-bold max-w-xl pb-6 md:pb-8 text-center">
              Open the Fink Message Editor
            </h2>
            <p class="text-xl text-surface-600 w-full md:w-[400px] text-center leading-relaxed">
              The i18n editor, requires a{" "}
              <span class="text-base font-mono py-[5px] px-2 bg-surface-100 rounded-lg text-surface-600">
                project.inlang
              </span>{" "}
              folder in your repository.
            </p>
          </div>
          {/* using a column to ease responsive design (mobile would be tricky othersie) */}
          <form
            class="relative w-full md:w-[600px] flex items-center group mt-4"
            onSubmit={(event) => navigateToEditor(event)}
          >
            <div
              class={
                "pl-5 pr-2 gap-2 relative z-10 flex items-center w-full border border-surface-200 bg-background rounded-lg transition-all " +
                (!isValidUrl() && input().length > 0
                  ? "focus-within:border-danger"
                  : "focus-within:border-primary")
              }
            >
              <input
                class={
                  "active:outline-0 focus:outline-0 focus:ring-0 border-0 h-14 grow placeholder:text-surface-500 placeholder:font-normal placeholder:text-base " +
                  (!isValidUrl() && input().length > 0
                    ? "text-danger"
                    : "text-surface-800")
                }
                placeholder="Enter repository url ..."
                onInput={(event) => {
                  // @ts-ignore
                  setInput(event.target.value);
                }}
                onPaste={(event) => {
                  // @ts-ignore
                  setInput(event.target.value);
                }}
                on:sl-change={() =>
                  isValidUrl() ? navigateToEditor : undefined
                }
              />
              {!isValidUrl() && input().length > 0 && (
                <p class="text-xs text-danger font-medium pr-1 max-sm:hidden">
                  Please enter a valid URL
                </p>
              )}
              <button
                disabled={isValidUrl() === false}
                onClick={(event) => navigateToEditor(event)}
                class={
                  (isValidUrl()
                    ? "bg-surface-800 text-background hover:bg-on-background"
                    : "bg-background text-surface-600 border") +
                  (!isValidUrl() && input().length > 0
                    ? " cursor-not-allowed"
                    : "") +
                  " flex justify-center items-center h-10 relative rounded-md px-4 border-surface-200 transition-all duration-100 text-sm font-medium"
                }
              >
                Open
              </button>
            </div>
            <div
              style={{
                background:
                  "linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
                transition: "all .3s ease-in-out",
              }}
              class="absolute bg-on-background top-0 left-0 w-full h-full opacity-10 blur-3xl group-hover:opacity-50 group-focus-within:opacity-50"
            />
            <div
              style={{
                background:
                  "linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
                transition: "all .3s ease-in-out",
              }}
              class="absolute bg-on-background top-0 left-0 w-full h-full opacity-5 blur-xl group-hover:opacity-15 group-focus-within:opacity-15"
            />
            <div
              style={{
                background:
                  "linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
                transition: "all .3s ease-in-out",
              }}
              class="absolute bg-on-background top-0 left-0 w-full h-full opacity-10 blur-sm group-hover:opacity-25 group-focus-within:opacity-25"
            />
          </form>

          <div class="pt-3">
            <Button
              type="text"
              href={
                import.meta.env.PROD
                  ? "https://inlang.com/g/6ddyhpoi"
                  : "http://localhost:3000/g/6ddyhpoi"
              }
            >
              Learn how to get started
            </Button>
          </div>
        </div>
        {/* END search bar */}
        <CommunityProjects />
      </EditorLayout>
    </>
  );
}
