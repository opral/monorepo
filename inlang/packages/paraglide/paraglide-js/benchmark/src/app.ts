import { init, getLocale, locales, setLocale } from "./i18n/generated.ts";

// some libraries require async initialization (e.g. i18next)
if (init) {
	// @ts-ignore can be undefined
	await init();
}

export function App(args: { children: string }): string {
	// @ts-expect-error - glboal variable
	globalThis.setLocale = setLocale;

	return `
    <div style="display: flex; gap: 1rem;">
      <a href="/" onclick="window.location.href='/'">All builds</a>
      <a href="/${process.env.BASE}">Home</a>
      <a href="/${process.env.BASE}/about">About</a>
    </div>

    <hr />

    <div style="display: flex; gap: 1rem;">
      <p>Current locale: ${getLocale()}</p>
      <p>Set locale: </p>
      ${locales.map((locale) => `<button onclick="setLocale('${locale}')">${locale}</button>`).join("")}
    </div>

    <hr />

    <div>
      ${args.children}
    </div>
  `;
}
