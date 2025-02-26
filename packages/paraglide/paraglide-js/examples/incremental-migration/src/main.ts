import { m } from "./paraglide/messages.js";
import i18next from "i18next";
import HttpApi from "i18next-http-backend";

await i18next.use(HttpApi).init({
	lng: "en",
	backend: {
		loadPath: "../locales/{{lng}}.json",
	},
});

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <p>Paraglide: ${m.greeting({ name: "Max Mustermann" })}</p>
    <p>i18next: ${i18next.t("greeting", { name: "Max Mustermann" })}</p>
  </div>
`;
