import {
  For,
  Match,
  Switch,
  onMount,
  Show,
  createSignal,
  createEffect,
  on,
} from "solid-js";
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded";
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded";
import IconClose from "~icons/material-symbols/close";
import IconLightbulb from "~icons/material-symbols/lightbulb-outline";
import { EditorStateProvider, useEditorState } from "./State.jsx";
import NoMatchPlaceholder from "./components/NoMatchPlaceholder.jsx";
import { ListHeader } from "./components/Listheader.jsx";
import { TourHintWrapper } from "./components/Notification/TourHintWrapper.jsx";
import { useLocalStorage } from "#src/services/local-storage/index.js";
import type { RecentProjectType } from "#src/services/local-storage/src/schema.js";
import { Message } from "./Message.jsx";
import { Errors } from "./components/Errors.jsx";
import { Layout } from "./Layout.jsx";
import Link from "#src/renderer/Link.jsx";
import { getAuthClient } from "@lix-js/client";
import { currentPageContext } from "#src/renderer/state.js";
import { replaceMetaInfo } from "./helper/ReplaceMetaInfo.js";
import { posthog as telemetryBrowser } from "posthog-js";
import { publicEnv } from "#src/services/env-variables/index.js";

const browserAuth = getAuthClient({
  gitHubProxyBaseUrl: publicEnv.PUBLIC_GIT_PROXY_BASE_URL,
  githubAppName: publicEnv.PUBLIC_LIX_GITHUB_APP_NAME,
  githubAppClientId: publicEnv.PUBLIC_LIX_GITHUB_APP_CLIENT_ID,
});

export const [messageCount, setMessageCount] = createSignal(0);
// only used to trigger a commit, push and pull for adding ninja
export const [triggerAddNinja, setTriggerAddNinja] = createSignal(false);
export const [showToolTip, setShowToolTip] = createSignal(false);

export default function Page() {
  onMount(() => {
    replaceMetaInfo(currentPageContext);
  });

  return (
    <EditorStateProvider>
      <Layout>
        <TheActualPage />
      </Layout>
    </EditorStateProvider>
  );
}

/**
 * The actual page that contains markup.
 *
 * This is separated from the Page component because the EditorStateProvider
 * is required to use the useEditorState hook.
 */
function TheActualPage() {
  const {
    repo,
    currentBranch,
    project,
    activeProject,
    projectList,
    routeParams,
    tourStep,
    lixErrors,
    languageTags,
    userIsCollaborator,
    isNinjaRecommendationDisabled,
    shouldRecommendNinja,
    filteredMessageLintRules,
    localChanges,
  } = useEditorState();
  const [localStorage, setLocalStorage] = useLocalStorage();

  onMount(() => {
    setLocalStorage("recentProjects", (prev) => {
      let recentProjects = prev[0] !== undefined ? prev : [];

      recentProjects = recentProjects.filter(
        (project) =>
          !(
            project.owner === routeParams().owner &&
            project.repository === routeParams().repository
          ),
      );

      const newProject: RecentProjectType = {
        owner: routeParams().owner,
        repository: routeParams().repository,
        description: "",
        lastOpened: new Date().getTime(),
        project: activeProject() ?? "",
      };
      recentProjects.push(newProject);

      return recentProjects
        .sort((a, b) => b.lastOpened - a.lastOpened)
        .slice(0, 7);
    });
  });

  createEffect(
    on([project, currentBranch], () => {
      setMessageCount(0);
    }),
  );

  return (
    <>
      <Switch
        fallback={
          <p class="text-danger">
            Switch fallback. This is likely an error. Please report it with code
            e329jafs.
          </p>
        }
      >
        <Match
          when={lixErrors().some((err: any) => err.message.includes("401"))}
        >
          <RepositoryDoesNotExistOrNotAuthorizedCard
            code={401}
            user={localStorage?.user}
          />
        </Match>

        <Match
          when={lixErrors().some(
            (err: any) =>
              err.message.includes("404") ||
              err.message.includes("403") ||
              err.response?.status === 404 ||
              err.response?.status === 403,
          )}
        >
          <RepositoryDoesNotExistOrNotAuthorizedCard
            code={404}
            user={localStorage?.user}
          />
        </Match>

        <Match when={lixErrors().length > 0}>
          <Errors
            errors={lixErrors()}
            message="An error occurred while cloning the repository:"
            messagePlural="errors occurred while cloning the repository:"
          />
        </Match>

        <Match when={!repo() || !projectList() || project.loading}>
          <div class="flex flex-col grow justify-center items-center min-w-full min-h-[calc(100vh_-_307px)] gap-2">
            {/* sl-spinner need a own div otherwise the spinner has a bug. The wheel is rendered on the outer div  */}
            <div>
              {/* use font-size to change the spinner size    */}
              <sl-spinner class="text-4xl" />
            </div>
            <p class="text-lg font-medium">
              Cloning large repositories can take a few seconds...
            </p>
            <br />
            <p class="max-w-lg">
              TL;DR you are currently cloning a real git repo, in the browser,
              on top of a virtual file system, which might lead to a new
              generation of software (see{" "}
              <Link
                class="link link-primary"
                href="https://www.youtube.com/watch?v=vJ3jGgCrz2I"
                target="_blank"
              >
                next git
              </Link>
              ).
              <br />
              <br />
              We are working on increasing the performance. Progress can be
              tracked in{" "}
              <Link
                href="https://github.com/orgs/inlang/projects/9"
                target="_blank"
                class="link link-primary"
              >
                project #9
              </Link>
              .
            </p>
          </div>
        </Match>
        <Match when={project()?.errors().length !== 0 && project()}>
          <Errors
            errors={project()?.errors() || []}
            message="An error occurred while initializing the project file:"
            messagePlural="Errors occurred while initializing the project file:"
          />
        </Match>
        <Match when={!project()?.settings}>
          <NoInlangProjectFoundCard />
        </Match>
        <Match
          when={
            project()?.settings &&
            project()?.query.messages.includedMessageIds() !== undefined
          }
        >
          <div class="min-h-[calc(100vh_-_200px)]">
            <ListHeader />
            <Show
              when={
                shouldRecommendNinja() === true &&
                filteredMessageLintRules().length !== 0 &&
                userIsCollaborator() &&
                !isNinjaRecommendationDisabled()
              }
            >
              <div class="flex flex-col sm:flex-row justify-start items-start w-full gap-2 px-4 py-1.5 border-x border-[#DFE2E4] bg-inverted-surface z-20 animate-blendIn">
                <div class="flex flex-wrap text-sm font-medium text-background/80">
                  <div class="flex justify-start items-start py-[5px] text-background">
                    <IconLightbulb class="w-5 h-5 mr-1" />
                    <span class="font-bold">Tip:</span>
                  </div>
                </div>
                <p class="my-auto sm:py-[5px] sm:items-center text-sm text-background/80">
                  Get warned about lint reports in pull requests by adding the
                  <a
                    class="ml-1 underline text-background/80 hover:text-background transition-colors duration-150"
                    href={
                      import.meta.env.PROD
                        ? "https://inlang.com/m/3gk8n4n4/app-inlang-ninjaI18nAction"
                        : "http://localhost:3000/m/3gk8n4n4/app-inlang-ninjaI18nAction"
                    }
                    target="_blank"
                  >
                    Ninja GitHub action
                  </a>
                  .
                </p>
                <div class="w-full sm:w-[212px] h-8 flex sm:flex-grow justify-end items-center gap-2">
                  <sl-tooltip
                    prop:content="Push changes before adding the Ninja GitHub action to keep a clean Git history."
                    prop:placement="bottom-end"
                    prop:trigger="hover"
                    prop:distance={10}
                    prop:disabled={localChanges() === 0}
                  >
                    <sl-button
                      prop:size="small"
                      prop:disabled={localChanges() !== 0}
                      onMouseEnter={() => setShowToolTip(true)}
                      onMouseLeave={() => setShowToolTip(false)}
                      onClick={() => setTriggerAddNinja(true)}
                      class={"on-inverted"}
                    >
                      Add Ninja GitHub action
                    </sl-button>
                  </sl-tooltip>
                  <button
                    onClick={() => {
                      setLocalStorage("disableNinjaRecommendation", (prev) => [
                        ...prev,
                        {
                          owner: routeParams().owner,
                          repository: routeParams().repository,
                        },
                      ]);
                      telemetryBrowser.capture("EDITOR user rejected Ninja");
                    }}
                    class="rounded w-[30px] h-[30px] flex justify-center items-center hover:bg-background/10 hover:text-background text-background/80"
                  >
                    <IconClose class="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Show>
            <Show when={window}>
              <TourHintWrapper
                currentId="textfield"
                position="bottom-left"
                offset={{ x: 110, y: 144 }}
                isVisible={
                  tourStep() === "textfield" &&
                  messageCount() !== 0 &&
                  languageTags().length > 1
                }
              >
                <></>
              </TourHintWrapper>
              <For each={project()!.query.messages.includedMessageIds()}>
                {(id) => {
                  return <Message id={id} />;
                }}
              </For>
            </Show>

            <div
              class={
                "flex flex-col h-[calc(100vh_-_307px)] grow justify-center items-center min-w-full gap-2 " +
                (messageCount() > 0 ? "hidden" : "")
              }
            >
              <NoMatchPlaceholder />
              <p class="text-base font-medium text-left text-on-background">
                No results matched your search.
              </p>
              <p class="text-[13px] text-center text-on-surface-variant">
                Please remove some filters to get more matches.
              </p>
            </div>
          </div>
        </Match>
      </Switch>
    </>
  );
}

function NoInlangProjectFoundCard() {
  return (
    <div class="min-h-[calc(100vh_-_307px)] flex grow items-center justify-center">
      <div class="bg-background border border-outline p-8 rounded flex flex-col max-w-lg animate-fadeInBottom">
        <MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center" />
        <h1 class="font-semibold pt-5">
          Inlang has not been set up for this repository yet.
        </h1>
        <p class="pt-1.5 pb-8">
          Please refer to product page and setup a inlang project.
        </p>
        <Link
          class="self-center"
          href={
            import.meta.env.PROD
              ? "https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor"
              : "http://localhost:3000/m/tdozzpar/app-inlang-finkLocalizationEditor"
          }
          target="_blank"
        >
          <sl-button prop:variant="text">
            Take me to setup guide
            {/* @ts-ignore */}
            <MaterialSymbolsArrowOutwardRounded slot="suffix" />
          </sl-button>
        </Link>
      </div>
    </div>
  );
}

function RepositoryDoesNotExistOrNotAuthorizedCard(args: {
  code: number;
  user: any;
}) {
  return (
    <div class="min-h-[calc(100vh_-_307px)] flex grow items-center justify-center">
      <div class="bg-background border border-outline p-12 rounded-xl flex flex-col max-w-lg animate-fadeInBottom">
        <h2 class="font-semibold pt-12">Cannot access the repository</h2>

        <ul class="pt-8 list-disc pl-4">
          {args.user?.isloggedIn ? (
            <li class="pt-2">
              If this is a <span class="font-bold">private repository</span> you
              need need to add it to the github app permissions by clicking the
              button below
            </li>
          ) : (
            <li class="pt-2">
              If this is a <span class="font-bold">private repository</span> you
              need to sign in at the bottom of the page.
            </li>
          )}

          <li class="pt-2">
            If this is a <span class="font-bold">public repository</span> please
            check the spelling
          </li>
        </ul>

        <Link
          class="self-end pt-5"
          href="https://github.com/opral/monorepo/discussions/categories/help-questions-answers"
          target="_blank"
        >
          <sl-button prop:variant="text">
            I need help
            {/* @ts-ignore */}
            <MaterialSymbolsArrowOutwardRounded slot="suffix" />
          </sl-button>
        </Link>

        {args.user?.isloggedIn ? (
          <sl-button
            class="on-inverted self-end pt-5"
            onClick={async () => {
              await browserAuth.addPermissions();
              location.reload();
            }}
          >
            Add github app permissions{" "}
            <div slot="suffix">
              <svg viewBox="0 0 32 32" width="1.2em" height="1.2em">
                <path
                  fill="currentColor"
                  d="M16 .396c-8.839 0-16 7.167-16 16c0 7.073 4.584 13.068 10.937 15.183c.803.151 1.093-.344 1.093-.772c0-.38-.009-1.385-.015-2.719c-4.453.964-5.391-2.151-5.391-2.151c-.729-1.844-1.781-2.339-1.781-2.339c-1.448-.989.115-.968.115-.968c1.604.109 2.448 1.645 2.448 1.645c1.427 2.448 3.744 1.74 4.661 1.328c.14-1.031.557-1.74 1.011-2.135c-3.552-.401-7.287-1.776-7.287-7.907c0-1.751.62-3.177 1.645-4.297c-.177-.401-.719-2.031.141-4.235c0 0 1.339-.427 4.4 1.641a15.436 15.436 0 0 1 4-.541c1.36.009 2.719.187 4 .541c3.043-2.068 4.381-1.641 4.381-1.641c.859 2.204.317 3.833.161 4.235c1.015 1.12 1.635 2.547 1.635 4.297c0 6.145-3.74 7.5-7.296 7.891c.556.479 1.077 1.464 1.077 2.959c0 2.14-.02 3.864-.02 4.385c0 .416.28.916 1.104.755c6.4-2.093 10.979-8.093 10.979-15.156c0-8.833-7.161-16-16-16z"
                />
              </svg>
            </div>
          </sl-button>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
