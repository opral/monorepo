import { For } from "solid-js";
import { PatternEditor } from "./PatternEditor.jsx";
import type * as ast from "@inlang/core/ast";
import MaterialSymbolsCommitRounded from "~icons/material-symbols/commit-rounded";
import MaterialSymbolsTranslateRounded from "~icons/material-symbols/translate-rounded";
import MaterialSymbolsDelete from "~icons/material-symbols/delete";
import MaterialSymbolsHistory from "~icons/material-symbols/history";

export function PreviewMessageFeatures() {
  const messages = {
    en: mockMessage(
      "What can inlang provide to make localization for developers easier?"
    ),
    de: mockMessage(
      "Was kann inlang bieten, um die Lokalisierung für Entwickler zu erleichtern?"
    ),
    "zh-cn": mockMessage("inlang可以提供什么 使开发人员的本地化更容易？"),
  };

  return (
    <div class="border border-outline p-4 rounded grid grid-cols-1 md:grid-cols-3 gap-10">
      <div class="flex flex-col grow gap-4 md:col-span-2">
        <a
          class="font-medium hover:ring-2 hover:ring-primary "
          href="https://github.com/inlang/inlang/discussions/categories/feedback"
          target="_blank"
        >
          FEATURE PREVIEW
        </a>
        <a
          class="text-sm hover:ring-2 hover:ring-primary"
          href="https://github.com/inlang/inlang/discussions/341"
          target="_blank"
        >
          This is a comment of a Message and a preview of future features of the
          inlang editor. Clicking on the elements in this Message will forward
          you to the corresponding discussion.
        </a>
        <div class="flex flex-col justify-center grow gap-4">
          <For each={Object.keys(messages)}>
            {(language) => (
              // disable pointer events to prevent the user from editing the message
              <a
                class="hover:ring-2 hover:ring-primary"
                href="https://github.com/inlang/inlang/discussions/344"
                target="_blank"
              >
                <div class="pointer-events-none">
                  <PatternEditor
                    language={language}
                    id={mockMessage("").id.name}
                    referenceMessage={mockMessage("")}
                    message={messages[language as keyof typeof messages]}
                  />
                </div>
              </a>
            )}
          </For>
        </div>
        <div class="flex justify-between">
          <sl-button-group>
            <sl-tooltip prop:content="Delete">
              <a
                class="hover:ring-2 hover:ring-primary"
                href="https://github.com/inlang/inlang/discussions/342"
                target="_blank"
              >
                <sl-button prop:variant="text">
                  <MaterialSymbolsDelete slot="prefix" />
                </sl-button>
              </a>
            </sl-tooltip>
            {/* called version control on purpose to reflect that inlang
            is built on versin control, not version history */}
            <sl-tooltip prop:content="Version control">
              <a
                class="hover:ring-2 hover:ring-primary"
                href="https://github.com/inlang/inlang/discussions/343"
                target="_blank"
              >
                <sl-button prop:variant="text" prop:outline={true}>
                  <MaterialSymbolsHistory slot="prefix" />
                </sl-button>
              </a>
            </sl-tooltip>
          </sl-button-group>
          <sl-button-group>
            <a
              class="hover:ring-2 hover:ring-primary"
              href="https://github.com/inlang/inlang/discussions/328"
              target="_blank"
            >
              <sl-button prop:variant="neutral">
                <MaterialSymbolsTranslateRounded slot="prefix" />
                Machine translate
              </sl-button>
            </a>
            <sl-button prop:variant="primary" prop:disabled={true}>
              <MaterialSymbolsCommitRounded slot="prefix" />
              Commit
            </sl-button>
          </sl-button-group>
        </div>
      </div>
      <a
        class="hover:ring-2 hover:ring-primary"
        href="https://github.com/inlang/inlang/discussions/171"
        target="_blank"
      >
        <img
          class="rounded-md object-contain hover:ring-2 hover:ring-primary"
          src="/images/preview-feature-screenshots.png"
          alt="preview feature screenshots"
        />
      </a>
    </div>
  );
}

function mockMessage(pattern: string) {
  return {
    type: "Message",
    id: {
      type: "Identifier",
      name: "example",
    },
    pattern: {
      type: "Pattern",
      elements: [
        {
          type: "Text",
          value: pattern,
        },
      ],
    },
  } satisfies ast.Message;
}
