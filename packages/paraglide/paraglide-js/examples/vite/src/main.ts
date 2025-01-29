import * as m from "./paraglide/messages.js";

// This should be removed by the compiler
// (can be verified by inspecting the output in dist)
m.unused();

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>${m.greeting({ name: "John Doe" })}</h1>
  </div>
`;
