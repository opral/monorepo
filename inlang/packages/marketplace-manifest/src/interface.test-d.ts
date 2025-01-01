import type { MarketplaceManifest } from "./interface.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const app: MarketplaceManifest = {
  // @ts-expect-error - if wrong type is used
  type: "package",
  name: { en: "My App" },
  description: { en: "My App is the best app." },
  keywords: ["app", "best"],
  publisherName: "My Company",
  license: "Apache-2.0",
  website: "https://my-app.com",
  readme: { en: "https://my-app.com/readme.md" },
};
