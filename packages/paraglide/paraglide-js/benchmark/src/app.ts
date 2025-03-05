import "./i18n/api.ts";

// some libraries require async initialization (e.g. i18next)
await initI18n();

export function App(args: { children: string }): string {
	return `
    <div style="display: flex; gap: 1rem;">
      <a href="/" onclick="window.location.href='/'">All builds</a>
      <a href="/${process.env.BASE}">Home</a>
      ${process.env.GENERATE_ABOUT_PAGE ? `<a href="/${process.env.BASE}/about">About</a>` : ""}
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
