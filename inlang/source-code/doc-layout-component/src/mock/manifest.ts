import type { MarketplaceManifest } from "@inlang/marketplace-manifest";

export const manifest: MarketplaceManifest & { uniqueID: string } = {
  $schema: "https://inlang.com/schema/marketplace-manifest",
  id: "library.inlang.paraglideJs",
  uniqueID: "gerre34r",
  icon: "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/paraglideNoBg.png",
  gallery: [
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/og.png",
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-1.jpg",
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-2.jpg",
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-3.jpg",
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-4.jpg",
  ],
  displayName: {
    en: "Paraglide JS",
  },
  description: {
    en: "Simple, adaptable and tiny i18n library that integrates with any framework",
  },
  pages: {
    Overview: {
      "/": "./inlang/source-code/paraglide/paraglide-js/README.md",
      "/changelog": "./inlang/source-code/paraglide/paraglide-js/CHANGELOG.md",
    },
    Documentation: {
      "/api": "./inlang/source-code/paraglide/paraglide-js/README.md",
      "/advanced": "./inlang/source-code/paraglide/paraglide-js/README.md",
      "/getting-started":
        "./inlang/source-code/paraglide/paraglide-js/README.md",
    },
    "Further Reading": {
      "/examples": "./g/jdhfksd/example-guide",
      "/license": "./inlang/source-code/paraglide/paraglide-js/LICENSE.md",
    },
  },
  keywords: [
    "paraglide js",
    "libraries",
    "apps",
    "website",
    "developer",
    "paraglide",
    "i18n",
    "library",
    "localization",
    "sdk",
    "sdk-js",
    "svelte",
    "react",
    "nextjs",
    "remix",
    "vue",
    "astro",
    "javascript",
    "solid",
    "typescript",
  ],
  recommends: ["m/reootnfj", "m/632iow21", "m/r7kp499g", "m/teldgniy"],
  pricing: "free",
  publisherName: "inlang",
  publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
  license: "Apache-2.0",
};

export const manifestWithoutNamespace: MarketplaceManifest & {
  uniqueID: string;
} = {
  $schema: "https://inlang.com/schema/marketplace-manifest",
  id: "library.inlang.paraglideJs",
  uniqueID: "gerre34r",
  icon: "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/paraglideNoBg.png",
  gallery: [
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/og.png",
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-1.jpg",
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-2.jpg",
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-3.jpg",
    "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/paraglide-gallery/paraglide-gallery-image-4.jpg",
  ],
  displayName: {
    en: "Paraglide JS",
  },
  description: {
    en: "Simple, adaptable and tiny i18n library that integrates with any framework",
  },
  pages: {
    "/": "./inlang/source-code/paraglide/paraglide-js/README.md",
    "/changelog": "./inlang/source-code/paraglide/paraglide-js/CHANGELOG.md",
    "/api": "./inlang/source-code/paraglide/paraglide-js/README.md",
    "/advanced": "./inlang/source-code/paraglide/paraglide-js/README.md",
    "/getting-started": "./inlang/source-code/paraglide/paraglide-js/README.md",
    "/examples": "./inlang/source-code/paraglide/paraglide-js/README.md",
    "/license": "./inlang/source-code/paraglide/paraglide-js/LICENSE.md",
  },
  keywords: [
    "paraglide js",
    "libraries",
    "apps",
    "website",
    "developer",
    "paraglide",
    "i18n",
    "library",
    "localization",
    "sdk",
    "sdk-js",
    "svelte",
    "react",
    "nextjs",
    "remix",
    "vue",
    "astro",
    "javascript",
    "solid",
    "typescript",
  ],
  recommends: ["m/reootnfj", "m/632iow21", "m/r7kp499g", "m/teldgniy"],
  pricing: "free",
  publisherName: "inlang",
  publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
  license: "Apache-2.0",
};

export const html = `<h1>HTML Ipsum Presents</h1>

<p><strong>Pellentesque habitant morbi tristique</strong> senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. <em>Aenean ultricies mi vitae est.</em> Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, <code>commodo vitae</code>, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. <a href="#">Donec non enim</a> in turpis pulvinar facilisis. Ut felis.</p>

<h2>Header Level 2</h2>

<ol>
   <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
   <li>Aliquam tincidunt mauris eu risus.</li>
</ol>

<blockquote><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus magna. Cras in mi at felis aliquet congue. Ut a est eget ligula molestie gravida. Curabitur massa. Donec eleifend, libero at sagittis mollis, tellus est malesuada tellus, at luctus turpis elit sit amet quam. Vivamus pretium ornare est.</p></blockquote>

<h3>Header Level 3</h3>

<ul>
   <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
   <li>Aliquam tincidunt mauris eu risus.</li>
</ul>

<pre><code>
#header h1 a {
  display: block;
  width: 300px;
  height: 80px;
}
</code></pre>`;
