import { m } from "./paraglide/messages.js";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>${m.message0()}</h1>
  </div>
`;
