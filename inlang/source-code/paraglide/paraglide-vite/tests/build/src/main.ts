import * as m from "./paraglide/messages.js"
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>${m.greeting({ name: "John Doe" })}</h1>
  </div>
`
