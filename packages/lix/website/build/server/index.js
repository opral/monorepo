import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer, Outlet, useLoaderData, Meta, Links, ScrollRestoration, Scripts, Link } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useEffect } from "react";
import { posthog } from "posthog-js";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
async function loader() {
  return { PUBLIC_LIX_POSTHOG_TOKEN: process.env.PUBLIC_LIX_POSTHOG_TOKEN };
}
const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  },
  {
    rel: "icon",
    type: "image/x-icon",
    href: "/favicon.svg"
  }
];
function Layout({ children }) {
  const env = useLoaderData();
  useEffect(() => {
    if (env.PUBLIC_LIX_POSTHOG_TOKEN) {
      posthog.init(env.PUBLIC_LIX_POSTHOG_TOKEN, {
        api_host: "https://eu.i.posthog.com",
        capture_performance: false,
        autocapture: {
          capture_copied_text: true
        }
      });
      posthog.capture("$pageview");
    } else {
      console.info("No posthog token found");
    }
    return () => posthog.reset();
  }, []);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx("div", { className: "min-h-screen", children }),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] }) });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: App,
  links,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const IconDiscord = () => {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: "20",
      height: "20",
      viewBox: "0 -28.5 256 256",
      version: "1.1",
      xmlns: "http://www.w3.org/2000/svg",
      xmlnsXlink: "http://www.w3.org/1999/xlink",
      preserveAspectRatio: "xMidYMid",
      fill: "currentColor",
      children: [
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_bgCarrier", strokeWidth: "0" }),
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_tracerCarrier", strokeLinecap: "round", strokeLinejoin: "round" }),
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_iconCarrier", children: /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx(
          "path",
          {
            d: "M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z",
            fill: "currentColor",
            fillRule: "nonzero"
          }
        ) }) })
      ]
    }
  );
};
const IconGitHub = () => {
  return /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
    }
  ) });
};
const IconLix = ({ className }) => {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: "26.48",
      height: "18",
      viewBox: "0 0 189 129",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className: className || "text-[#07B6D4]",
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M107.415 40L123.438 70.5114L163.858 0H188.688L139.404 83.6364L165.369 127.273H140.654L123.438 97.1023L106.506 127.273H81.5059L107.415 83.6364L82.4149 40H107.415Z",
            fill: "currentColor"
          }
        ),
        /* @__PURE__ */ jsx("path", { d: "M43.5938 127.273V40H67.7983V127.273H43.5938Z", fill: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M24 0.261719V128.262H0V0.261719H24Z", fill: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M44 0.261719H108V20.2617H44V0.261719Z", fill: "currentColor" })
      ]
    }
  );
};
const IconX = () => {
  return /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "M14.6 2.74972H17.0537L11.6937 8.89143L18 17.2503H13.0629L9.19314 12.1817L4.77029 17.2503H2.31429L8.04686 10.6789L2 2.75086H7.06286L10.5554 7.38286L14.6 2.74972ZM13.7371 15.7783H15.0971L6.32 4.14515H4.86171L13.7371 15.7783Z", fill: "currentColor" }) }) });
};
const socialLinks = [
  {
    text: "GitHub",
    href: "https://github.com/opral/lix-sdk",
    icon: /* @__PURE__ */ jsx(IconGitHub, {})
  },
  {
    text: "Discord",
    href: "https://discord.gg/gdMPPWy57R",
    icon: /* @__PURE__ */ jsx(IconDiscord, {})
  },
  {
    text: "Twitter",
    href: "https://x.com/lixCCS",
    icon: /* @__PURE__ */ jsx(IconX, {})
  }
];
const Header = () => {
  return /* @__PURE__ */ jsxs("header", { className: "w-full max-w-5xl px-4 py-3 mx-auto flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx("div", { className: "pr-4", children: /* @__PURE__ */ jsx(IconLix, {}) }) }),
      /* @__PURE__ */ jsx(
        Link,
        {
          className: "md:px-1 py-1 text-slate-500 hover:text-cyan-600",
          target: "_blank",
          to: "https://github.com/opral/lix-sdk",
          children: "SDK Documentation"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          className: "md:px-1 py-1 text-slate-500 hover:text-cyan-600",
          to: "/file-manager",
          children: "File Manager"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          className: "md:px-1 py-1 text-slate-500 hover:text-cyan-600",
          target: "_blank",
          href: "https://opral.substack.com",
          children: "Blog"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center md:gap-3", children: socialLinks.map((socialLink, index) => /* @__PURE__ */ jsx(
      "a",
      {
        className: "p-2 text-slate-900 hover:text-cyan-600",
        href: socialLink.href,
        target: "_blank",
        rel: "noopener noreferrer",
        children: socialLink.icon
      },
      index
    )) })
  ] });
};
const IconCopyright = () => {
  return /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18px", height: "18px", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { fill: "currentColor", d: "M11.88 9.14c1.28.06 1.61 1.15 1.63 1.66h1.79c-.08-1.98-1.49-3.19-3.45-3.19C9.64 7.61 8 9 8 12.14c0 1.94.93 4.24 3.84 4.24c2.22 0 3.41-1.65 3.44-2.95h-1.79c-.03.59-.45 1.38-1.63 1.44c-1.31-.04-1.86-1.06-1.86-2.73c0-2.89 1.28-2.98 1.88-3M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8" }) });
};
const IconSubstack = () => {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      role: "img",
      width: "20",
      height: "20",
      viewBox: "0 0 1000 1000",
      fill: "currentColor",
      strokeWidth: "1.8",
      stroke: "none",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("path", { d: "M764.166 348.371H236.319V419.402H764.166V348.371Z" }),
        /* @__PURE__ */ jsx("path", { d: "M236.319 483.752V813.999L500.231 666.512L764.19 813.999V483.752H236.319Z" }),
        /* @__PURE__ */ jsx("path", { d: "M764.166 213H236.319V284.019H764.166V213Z" })
      ] })
    }
  );
};
const Footer = () => {
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { className: "w-full mt-20 mb-4 border-t border-surface-200", children: /* @__PURE__ */ jsxs("footer", { className: "mt-8 w-full max-w-5xl px-4 py-3 mx-auto flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "card flex flex-wrap justify-between items-end md:items-center gap-4", children: [
      /* @__PURE__ */ jsxs("p", { className: "flex flex-col gap-0.5 text-slate-800", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold mb-0.5", children: "Stay in the loop!" }),
        "Get regular updates and be the first who can use Lix."
      ] }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://opral.substack.com/",
          target: "_blanc",
          className: "w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2",
          children: [
            /* @__PURE__ */ jsx(IconSubstack, {}),
            "Subscribe"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-8", children: /* @__PURE__ */ jsxs("div", { className: "flex whitespace-nowrap gap-0.5 items-center text-slate-900 font-semibold", children: [
        /* @__PURE__ */ jsx(IconCopyright, {}),
        "Lix by Opral"
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: socialLinks.map((socialLink, index) => /* @__PURE__ */ jsx(
        "a",
        {
          className: "p-2 text-slate-500 hover:text-cyan-600",
          href: socialLink.href,
          target: "_blank",
          rel: "noopener noreferrer",
          children: socialLink.text
        },
        index
      )) })
    ] })
  ] }) }) });
};
const IconBranch = () => /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", fill: "none", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
  "path",
  {
    fill: "#000",
    d: "M21 5a3 3 0 1 0-4 2.816V11H7V7.816a3 3 0 1 0-2 0v8.368a3 3 0 1 0 2 0V13h10a2 2 0 0 0 2-2V7.816A2.99 2.99 0 0 0 21 5"
  }
) });
const IconConversation = () => /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", fill: "none", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
  "path",
  {
    fill: "#000",
    d: "M19 8h-1V5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v12a1 1 0 0 0 .62.92 1 1 0 0 0 1.09-.21l2.81-2.82H8v1.44a3 3 0 0 0 3 3h6.92l2.37 2.38A1 1 0 0 0 21 22a.84.84 0 0 0 .38-.08A1 1 0 0 0 22 21V11a3 3 0 0 0-3-3M8 11v1.89H6.11a1 1 0 0 0-.71.29L4 14.59V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3h-5a3 3 0 0 0-3 3m12 7.59-1-1a1 1 0 0 0-.71-.3H11a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1z"
  }
) });
const IconSync = () => /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", fill: "none", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
  "path",
  {
    fill: "#000",
    d: "m7 21-5-5 5-5 1.425 1.4-2.6 2.6H21v2H5.825l2.6 2.6zm10-8-1.425-1.4 2.6-2.6H3V7h15.175l-2.6-2.6L17 3l5 5z"
  }
) });
const Check = () => {
  return /* @__PURE__ */ jsx("div", { className: "h-6 w-6 text-cyan-500 bg-cyan-100 rounded-full flex justify-center items-center", children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "11", viewBox: "0 0 14 11", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M1.79053 5.17385L5.1433 8.39587L12.2095 1.60414", stroke: "currentColor", strokeWidth: "2.62943" }) }) });
};
const Details = (props) => {
  return /* @__PURE__ */ jsxs("details", { children: [
    /* @__PURE__ */ jsx(
      "summary",
      {
        className: "flex gap-2 justify-between cursor-pointer font-medium list-none transition-colors text-slate-500 hover:text-cyan-500\n        after:inline-block after:w-6 after:h-6 after:p-3 after:bg-contain after:bg-[url('/images/chevron-down.svg')] after:bg-no-repeat after:transform after:rotate-0 after:transition-transform after:duration-200 after:ease-in-out",
        children: props.summary
      }
    ),
    /* @__PURE__ */ jsx("p", { className: "my-3 sm:pr-8 lg:w-11/12", children: props.content })
  ] });
};
const meta$1 = () => {
  const ogImage = [
    {
      property: "og:url",
      content: "https://lix.opral.com/file-manager"
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:title",
      content: "Lix file manager"
    },
    {
      property: "og:description",
      content: "Lix file manager understands changes in your files, making it easy to see detailed updates, collaborate, comment, and automate tasks directly within your documents."
    },
    {
      property: "og:image",
      content: "https://lix.opral.com/images/og-image-lix.png"
    },
    {
      property: "og:image:type",
      content: "image/png"
    },
    {
      property: "og:image:width",
      content: "1200"
    },
    {
      property: "og:image:height",
      content: "630"
    },
    {
      name: "twitter:card",
      content: "Lix file manager with build-in change control"
    },
    {
      property: "twitter:url",
      content: "https://lix.opral.com/"
    },
    {
      name: "twitter:title",
      content: "Lix file manager"
    },
    {
      name: "twitter:description",
      content: "Lix file manager understands changes in your files, making it easy to see detailed updates, collaborate, comment, and automate tasks directly within your documents."
    },
    {
      name: "twitter:image:src",
      content: "https://lix.opral.com/images/og-image-lix.png"
    }
  ];
  return [
    { title: "Lix file manager" },
    {
      name: "description",
      content: "The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang."
    },
    {
      name: "keywords",
      content: "change control, file-based apps, collaboration, automation, change graph"
    },
    ...ogImage
  ];
};
const faq$1 = [
  {
    question: "When will this be available for general use?",
    answer: "Lix is currently in the closed beta phase, where we're actively refining features based on user feedback. We’re excited to announce a launch event on December 16th. Sign up to join and be among the first to experience the release!"
  },
  {
    question: "How does this integrate with my already existing software?",
    answer: "Lix is file-based, meaning you can seamlessly use your preferred applications alongside Lix’s internal tools. For instance, you can edit a CSV file in Numbers or Excel, and once you're done, simply upload it back to the Lix file manager. Lix will automatically understand the changes you made."
  },
  {
    question: "Where does my data get stored?",
    answer: "By default, your data is stored locally on your device, allowing for full offline support out of the box. Your files are only synced with other users or cloud storage when you choose to do so, ensuring complete control over your data."
  },
  {
    question: "How Lix compare to Git / version control?",
    answer: "Lix focuses on simplifying file management and collaboration, especially for non-developers. Read more about that in on lix.opral.com"
  },
  {
    question: "Is Lix free or do I need to buy it?",
    answer: "The private beta will be completely free to use. As we approach the official launch, we’re still finalizing future pricing plans."
  },
  {
    question: "Does Lix also work with AI?",
    answer: "Yes! Lix offers a flexible automation surface where you can connect any AI API of your choice. Additionally, native AI features are on our roadmap."
  }
];
const automatedTasks = [
  {
    title: "Build pipelines"
  },
  {
    title: "Quality checks"
  },
  {
    title: "Connect external APIs"
  }
];
const collaborationFeatures = [
  {
    title: "Sync your lix with others",
    description: "Easily share your Lix with others to keep everyone on the same page.",
    icon: /* @__PURE__ */ jsx(IconSync, {})
  },
  {
    title: "Create and share proposals",
    description: "Draft proposals, gather feedback, and refine your ideas—all in one platform.",
    icon: /* @__PURE__ */ jsx(IconBranch, {})
  },
  {
    title: "Achieve quality through review",
    description: "Collaborate with your team to review files, make edits, and ensure top-notch quality.",
    icon: /* @__PURE__ */ jsx(IconConversation, {})
  }
];
const createFeatures = [
  {
    title: "Drop your files",
    description: "Simply drag and drop your files into Lix's file manager."
  },
  {
    title: "Get change control",
    description: "Lix automatically tracks all changes, allowing you to trace edits, recover previous versions, and collaborate seamlessly."
  }
];
function FileManager() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-50", children: /* @__PURE__ */ jsx(Header, {}) }),
    /* @__PURE__ */ jsxs("main", { children: [
      /* @__PURE__ */ jsx("div", { className: "w-full h-fit bg-slate-50 p-4 slanted", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl justify-center items-center text-center mt-16 mb-48", children: [
        /* @__PURE__ */ jsxs("div", { className: "mx-auto flex items-center gap-2 w-fit p-2 text-slate-500 ring-1 ring-slate-200 rounded-md mb-4 bg-white", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-slate-200 p-1.5 py-1 w-fit rounded", children: /* @__PURE__ */ jsx(IconLix, { className: "w-4 h-4 text-slate-500" }) }),
          "The Lix File Manager App"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl sm:text-5xl leading-[1.2] font-semibold", children: "Manage files, changes, and automations in your lix." }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto max-w-lg my-8" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-center w-full gap-2", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/app/fm",
              className: "w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2 transition-all",
              children: "Try it out"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://opral.substack.com/",
              target: "_blank",
              className: "w-full sm:w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex justify-center items-center gap-2 ring-1 ring-slate-300 hover:ring-slate-400 transition-all",
              children: "Get updates"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-5xl mx-auto px-4 space-y-16 sm:space-y-24 md:space-y-32", children: [
        /* @__PURE__ */ jsx("div", { className: "w-full -mb-32 aspect-[1.48/1] sm:aspect-[2.1/1] relative", children: /* @__PURE__ */ jsxs("div", { className: "-mt-32 ring-1 ring-slate-200 bg-slate-100 rounded-2xl p-2 absolute", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              className: "hidden sm:block rounded-xl ring-1 ring-slate-200",
              src: "/images/lix-fm.svg",
              alt: "Lix File Manager"
            }
          ),
          /* @__PURE__ */ jsx(
            "img",
            {
              className: "sm:hidden rounded-xl ring-1 ring-slate-200",
              src: "/images/lix-fm-mobile.svg",
              alt: "Lix File Manager"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap md:grid grid-cols-12 gap-4 md:gap-8 sm:gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-5", children: [
            /* @__PURE__ */ jsx("h2", { className: "mt-2", children: "Create" }),
            /* @__PURE__ */ jsx("p", { className: "mt-4 sm:w-4/5 md:w-full", children: "Create with the freedom of change control. Trace, recover or simple read the history like a book to be always on track." }),
            /* @__PURE__ */ jsx("div", { className: "sm:grid md:block grid-cols-2 gap-4 md:gap-8", children: createFeatures.map((feature, index) => /* @__PURE__ */ jsx("div", { className: "my-6 max-w-sm flex gap-5", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "rounded-sm px-0.5 py-0.5 bg-slate-100 w-8 text-center text-slate-700 text-sm font-medium", children: [
                "0",
                index + 1
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "font-medium pt-2", children: feature.title }),
              /* @__PURE__ */ jsx("p", { children: feature.description })
            ] }) }, index)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "col-span-7 pr-4 sm:pr-8 pt-4 sm:pt-7 h-fit self-end bg-slate-100 rounded-lg ring-1 ring-slate-200 overflow-clip flex items-end", children: /* @__PURE__ */ jsx(
            "img",
            {
              className: "ring-1 ring-slate-200 rounded-tr-lg",
              src: "/images/fm-create.svg",
              alt: "File Manager Features"
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-center w-full", children: "Collaboration" }),
          /* @__PURE__ */ jsx("p", { className: "text-center mt-4", children: "Sync, share, and work together." }),
          /* @__PURE__ */ jsx("div", { className: "my-8 pt-4 sm:pt-7 px-4 sm:px-8 bg-slate-100 rounded-lg ring-1 ring-slate-200 overflow-x-auto flex justify-center", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-4 sm:gap-5", children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                className: "ring-1 ring-slate-200 rounded-t-lg sm:rounded-br-none w-[300px] sm:w-[320px]",
                src: "/images/fm-collaborate-1.svg",
                alt: "File Manager Automate"
              }
            ),
            /* @__PURE__ */ jsx(
              "img",
              {
                className: "ring-1 ring-slate-200 rounded-t-lg sm:rounded-bl-none w-[300px] sm:w-[320px]",
                src: "/images/fm-collaborate-2.svg",
                alt: "File Manager Automate"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-3 gap-8 sm:gap-4", children: collaborationFeatures.map((feature, index) => /* @__PURE__ */ jsxs("div", { children: [
            feature.icon,
            /* @__PURE__ */ jsx("h3", { className: "mt-4 font-medium", children: feature.title }),
            /* @__PURE__ */ jsx("p", { className: "mt-2", children: feature.description })
          ] }, index)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col-reverse sm:grid sm:grid-cols-12 gap-8 sm:gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "col-span-8 px-4 pt-4 sm:px-7 sm:pt-7 sm:mr-5 h-fit w-fit flex justify-center items-end bg-slate-100 rounded-lg ring-1 ring-slate-200 overflow-clip self-end", children: /* @__PURE__ */ jsx(
            "img",
            {
              className: "ring-1 ring-slate-200 rounded-t-lg",
              src: "/images/fm-automate.svg",
              alt: "File Manager Automate"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-4 col-start-9", children: [
            /* @__PURE__ */ jsx("h2", { className: "pt-2 md:pr-8", children: "Automations" }),
            /* @__PURE__ */ jsx("p", { className: "mt-4", children: "Link automations to file changes, making it easy to configure pipelines, run quality checks, and integrate APIs—all triggered automatically." }),
            /* @__PURE__ */ jsx("div", { className: "pt-4 flex flex-col gap-4", children: automatedTasks.map((feature, index) => /* @__PURE__ */ jsxs("div", { className: "max-w-sm flex items-start gap-5", children: [
              /* @__PURE__ */ jsx(Check, {}),
              /* @__PURE__ */ jsx("div", { className: "space-y-1", children: /* @__PURE__ */ jsx("h3", { className: "font-medium", children: feature.title }) })
            ] }, index)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-8 sm:gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-span-2 sm:col-span-1", children: [
            /* @__PURE__ */ jsx("h2", { children: "Open questions?" }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 flex gap-2", children: socialLinks.map((socialLink, index) => /* @__PURE__ */ jsx(
              "a",
              {
                href: socialLink.href,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "transition-all w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex items-center gap-2 ring-1 ring-slate-300 hover:ring-slate-400",
                children: socialLink.text
              },
              index
            )).slice(0, 2) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "sm:mt-3 col-span-2 space-y-3 sm:space-y-6", children: faq$1.map((question, index) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(
              Details,
              {
                summary: question.question,
                content: question.answer
              }
            ),
            faq$1.length - 1 !== index && /* @__PURE__ */ jsx("div", { className: "mt-3 sm:mt-6 border-b border-slate-200" })
          ] }, index)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "w-full ring-1 ring-slate-200 rounded-xl flex flex-col md:grid md:grid-cols-3 gap-4 overflow-clip", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-8 flex flex-col justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl pt-2", children: "Stay in the loop" }),
              /* @__PURE__ */ jsx("p", { className: "mt-4 sm:w-4/5 md:w-full", children: "Sign up to receive updates about lix and its file manager." })
            ] }),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://opral.substack.com/",
                target: "_blank",
                className: "mt-4 w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2 transition-all",
                children: "Get update"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "col-span-2 pl-4 sm:pl-8 md:pt-8 flex items-end", children: /* @__PURE__ */ jsx(
            "img",
            {
              className: "w-full ring-1 ring-slate-200 rounded-tl-lg",
              src: "/images/fm-waitlist.svg",
              alt: "File Manager Waitlist"
            }
          ) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: FileManager,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
const IconArrowExternal = () => {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "20px",
      height: "20px",
      viewBox: "0 0 15 15",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          fill: "currentColor",
          fillRule: "evenodd",
          d: "M3.646 11.354a.5.5 0 0 1 0-.707L10.293 4H6a.5.5 0 0 1 0-1h5.5a.5.5 0 0 1 .5.5V9a.5.5 0 0 1-1 0V4.707l-6.646 6.647a.5.5 0 0 1-.708 0",
          clipRule: "evenodd"
        }
      )
    }
  );
};
const meta = () => {
  const ogImage = [
    {
      property: "og:url",
      content: "https://lix.opral.com"
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:title",
      content: "Lix - Change Control System"
    },
    {
      property: "og:description",
      content: "The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang."
    },
    {
      property: "og:image",
      content: "https://lix.opral.com/images/og-image-lix.png"
    },
    {
      property: "og:image:type",
      content: "image/png"
    },
    {
      property: "og:image:width",
      content: "1200"
    },
    {
      property: "og:image:height",
      content: "630"
    },
    {
      name: "twitter:card",
      content: "Change graph of the lix change control system"
    },
    {
      property: "twitter:url",
      content: "https://lix.opral.com"
    },
    {
      name: "twitter:title",
      content: "Lix - Change Control System"
    },
    {
      name: "twitter:description",
      content: "The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang."
    },
    {
      name: "twitter:image:src",
      content: "https://lix.opral.com/images/og-image-lix.png"
    }
  ];
  return [
    { title: "Lix - Change Control System" },
    {
      name: "description",
      content: "The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang."
    },
    {
      name: "keywords",
      content: "change control, file-based apps, collaboration, automation, change graph"
    },
    ...ogImage
  ];
};
const coreFeatures = [
  {
    title: "Tracks changes",
    description: "Lix provides change control for every file stored in lix."
  },
  {
    title: "File agnostic",
    description: "Lix can understand any file format with the help of plugins."
  },
  {
    title: "Designed to build apps",
    description: "Lix enables file-based apps with change control features."
  }
];
const enabledByChangeControl = [
  {
    title: "Collaboration",
    list: ["Sync & async workflows", "Change proposals", "Review changes"],
    image: "/images/collaboration.svg"
  },
  {
    title: "Automation",
    list: ["Build pipelines", "Validation rules"],
    image: "/images/automation.svg"
  },
  {
    title: "Change Graph",
    list: ["Traceability", "Auditing", "Recovery"],
    image: "/images/change-graph.svg"
  }
];
const faq = [
  {
    question: "Is lix replacing git?",
    answer: "No. Lix is designed for everything but software engineering. This is reflected by being browser-based, and being able to track changes in any file format, not just text files."
  },
  {
    question: "How does it compare to versioning I know from other apps?",
    answer: "There are apps with versioning, but in many cases, they only save versions of the entire project at specific points in time. Lix tracks and understands the context of every change in a file, giving you more context and allowing you to set automations. Furthermore, Lix provides a generalized system that allows all files and apps to work together."
  },
  {
    question: "What is the difference between restore a Version and revert a change?",
    answer: "Restoring a version replaces the current document with an older snapshot, erasing all subsequent changes, while reverting a change precisely undoes a specific modification while preserving all later work. Essentially, restore is an all-or-nothing replacement, and revert is a targeted undo."
  }
];
function Index() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("main", { className: "w-full max-w-5xl px-4 mx-auto space-y-16 md:space-y-20", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 justify-center md:justify-start gap-16 md:gap-8 lg:gap-24 mt-12 mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-md", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-2 justify-center md:justify-start", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://www.npmjs.com/package/@lix-js/sdk",
                target: "_blank",
                children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: "https://img.shields.io/npm/dw/%40lix-js%2Fsdk?logo=npm&logoColor=red&label=npm%20downloads",
                    alt: "npm downloads"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx("a", { href: "https://discord.gg/xjQA897RyK", target: "_blank", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: "https://img.shields.io/discord/897438559458430986?style=flat&logo=discord&labelColor=white",
                alt: "discord"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", { className: "text-5xl leading-[1.2] font-semibold", children: "A change control system & SDK" }) }),
          /* @__PURE__ */ jsx("p", { className: "mt-8 mb-6", children: "The lix SDK for change control allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap-reverse items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/app/fm",
                className: "w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2 transition-all",
                children: "Try the demo"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://github.com/opral/monorepo/tree/main/packages/lix-sdk",
                target: "_blank",
                className: "w-full sm:w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex justify-center items-center gap-2 border border-slate-300 hover:border-slate-400 transition-all",
                children: "SDK documentation"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { children: coreFeatures.map((feature, index) => /* @__PURE__ */ jsxs("div", { className: "my-4 max-w-sm flex items-start gap-5", children: [
          /* @__PURE__ */ jsx(Check, {}),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: feature.title }),
            /* @__PURE__ */ jsx("p", { children: feature.description })
          ] })
        ] }, index)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center", children: "Built apps with the lix SDK" }),
        /* @__PURE__ */ jsxs("p", { className: "max-w-2xl text-center mt-4 mb-8", children: [
          "The lix SDK can be intergated into exsiting apps, or used as backend for new apps.",
          " ",
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://github.com/opral/lix-sdk",
              className: "text-cyan-600",
              children: "Visit the documentation for more information."
            }
          )
        ] }),
        /* @__PURE__ */ jsx("a", { href: "https://github.com/opral/lix-sdk", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/images/code-example.png",
            alt: "Simlified sketch of the lix file manager",
            className: "mb-2 sm:-mb-10 w-[724x] md:h-[300px] mt-4 mx-auto"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center", children: "Everything revolves around changes" }),
        /* @__PURE__ */ jsx("p", { className: "max-w-2xl text-center mt-4 mb-8", children: "A system, that can track changes across any file format is one single system that enables collaboration, automation, and traceability for every digital work we create." }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 w-full", children: enabledByChangeControl.map((feature, index) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "card flex flex-col items-start gap-2 mx-auto w-full sm:w-fit md:w-full",
            children: [
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: feature.image,
                  alt: feature.title,
                  className: "self-center w-[240px] h-[200px]"
                }
              ),
              /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: feature.title }),
              /* @__PURE__ */ jsx("ul", { className: "list-disc list-inside flex flex-col gap-0.5", children: feature.list.map((item, index2) => /* @__PURE__ */ jsx("li", { className: "list-item text-slate-500", children: item }, index2)) })
            ]
          },
          index
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-center", children: "Try the demo" }),
        /* @__PURE__ */ jsx("p", { className: "max-w-lg text-center mt-4 mb-8", children: "The file manager app is a demo of the lix change control system. Import files, make changes, and see the change control in action." }),
        /* @__PURE__ */ jsx("div", { className: "card relative w-full group cursor-pointer", children: /* @__PURE__ */ jsxs("a", { href: "/file-manager", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: "/images/file-manager.svg",
              alt: "Simlified sketch of the lix file manager",
              className: "mb-2 sm:-mb-10 w-[724x] md:h-[300px] mt-4 mx-auto"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end gap-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Lix File Manager" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1", children: "All your files under change control." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-[14px] md:bottom-6 right-[14px] md:right-6 flex justify-center items-center w-10 h-10 rounded-full bg-white text-slate-500 transition-all ring-1 ring-slate-200 group-hover:text-cyan-500  group-hover:ring-cyan-500", children: /* @__PURE__ */ jsx("div", { className: "transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", children: /* @__PURE__ */ jsx(IconArrowExternal, {}) }) })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("hr", {}),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-8 md:gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 md:col-span-1", children: [
          /* @__PURE__ */ jsx("h2", { children: "FAQ" }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 flex gap-2", children: socialLinks.map((socialLink, index) => /* @__PURE__ */ jsx(
            "a",
            {
              href: socialLink.href,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "transition-all w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex items-center gap-2 border border-slate-300 hover:border-slate-400",
              children: socialLink.text
            },
            index
          )).slice(0, 2) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:mt-3 col-span-2 space-y-3 md:space-y-6", children: faq.map((question, index) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(
            Details,
            {
              summary: question.question,
              content: question.answer
            }
          ),
          faq.length - 1 !== index && /* @__PURE__ */ jsx("div", { className: "mt-3 md:mt-6 border-b border-slate-200" })
        ] }, index)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 max-w-xl md:mx-auto pl-4 md:pl-16 border-l-2 border-surface-200", children: [
        /* @__PURE__ */ jsx("p", { className: "italic text-slate-800", children: '"Every work that we create, every time we collaborate, everything we automate, it revolves around changes. A system, that can understand changes and inform you about that these changes happened, means that you have a system to collaborate, validate, automate and create."' }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Samuel Stroschein,",
          " ",
          /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap", children: "Founder of Opral (lix & inlang)" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-SDOp8khY.js", "imports": ["/assets/components-CPTYHW_4.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-CLr9yq5H.js", "imports": ["/assets/components-CPTYHW_4.js"], "css": ["/assets/root-NH48B0Zk.css"] }, "routes/file-manager": { "id": "routes/file-manager", "parentId": "root", "path": "file-manager", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/file-manager-Dl7O6PQI.js", "imports": ["/assets/components-CPTYHW_4.js", "/assets/details-BBHJ7WaA.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-CYL4jWh5.js", "imports": ["/assets/components-CPTYHW_4.js", "/assets/details-BBHJ7WaA.js"], "css": [] } }, "url": "/assets/manifest-aca36773.js", "version": "aca36773" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "unstable_singleFetch": false, "unstable_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/file-manager": {
    id: "routes/file-manager",
    parentId: "root",
    path: "file-manager",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route2
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
