import { For } from "solid-js";
import { locales, setLocale } from "~/paraglide/runtime";

export default function LocaleSwitch() {
  return (
    <div>
      <For each={locales}>
        {(locale) => <button onClick={() => setLocale(locale)}>{`Switch to "${locale}"`}</button>}
      </For>
    </div>
  );
}
