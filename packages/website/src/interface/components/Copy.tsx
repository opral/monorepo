import CopyIcon from "~icons/material-symbols/content-copy";
import CheckIcon from "~icons/material-symbols/check";
import { createSignal } from "solid-js";

export function Copy(props: { copy: string; class?: string }) {
  const [copied, setCopied] = createSignal(false);
  return (
    <div class="font-mono px-4 py-2.5 bg-surface-100 rounded-md text-sm border border-surface-2 flex items-center gap-4 text-surface-600 justify-between md:w-auto w-full">
      <p class="overflow-x-scroll">{props.copy}</p>
      {!copied() ? (
        <CopyIcon
          class="transition-colors cursor-pointer hover:text-surface-800 flex-shrink-0"
          onClick={() => {
            // copy to clipboard
            window.navigator.clipboard.writeText(props.copy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        />
      ) : (
        <CheckIcon class="text-surface-800 scale-125 flex-shrink-0" />
      )}
    </div>
  );
}
