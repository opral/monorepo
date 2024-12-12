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
  return { PUBLIC_POSTHOG_TOKEN: process.env.PUBLIC_POSTHOG_TOKEN };
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
    if (typeof window !== "undefined" && env.PUBLIC_POSTHOG_TOKEN) {
      posthog.init(env.PUBLIC_POSTHOG_TOKEN ?? "", {
        api_host: "https://tm.inlang.com",
        capture_performance: false,
        autocapture: {
          capture_copied_text: true
        }
      });
      posthog.capture("$pageview");
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
    href: "https://github.com/opral/monorepo",
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
      /* @__PURE__ */ jsx(Link, { className: "md:px-1 py-1 text-slate-500 hover:text-cyan-600", to: "/file-manager", children: "File Manager" }),
      /* @__PURE__ */ jsx(
        "a",
        {
          className: "md:px-1 py-1 text-slate-500 hover:text-cyan-600",
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
const Banner = () => {
  return /* @__PURE__ */ jsxs("div", { className: "flex justify-center items-center gap-3 h-16 md:h-[50px] text-[16px] px-3 bg-slate-100 border-b border-slate-200 text-black font-medium", children: [
    "New: Lix File Manager (Preview)",
    /* @__PURE__ */ jsx(
      "a",
      {
        className: "group text-cyan-600 hover:text-black border border-slate-200 md:mx-3 flex gap-2 items-center py-1 px-3 rounded-md bg-white whitespace-nowrap",
        href: "/app/fm",
        children: "Take a look"
      }
    )
  ] });
};
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
    title: "Track every change",
    description: "Lix automatically tracks all changes, allowing you to trace edits, recover previous versions, and collaborate seamlessly."
  }
];
function FileManager() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Banner, {}),
    /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-50", children: /* @__PURE__ */ jsx(Header, {}) }),
    /* @__PURE__ */ jsxs("main", { children: [
      /* @__PURE__ */ jsx("div", { className: "w-full h-fit bg-slate-50 p-4 slanted", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl justify-center items-center text-center mt-16 mb-48", children: [
        /* @__PURE__ */ jsxs("div", { className: "mx-auto flex items-center gap-2 w-fit p-2 text-slate-500 ring-1 ring-slate-200 rounded-md mb-3 bg-white", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-slate-200 p-1.5 py-1 w-fit rounded", children: /* @__PURE__ */ jsx(IconLix, { className: "w-4 h-4 text-slate-500" }) }),
          "File Manager"
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl sm:text-5xl leading-[1.2] font-semibold", children: [
          /* @__PURE__ */ jsx("span", { className: "relative inline-block after:block after:h-1 after:w-full after:absolute after:skew-y-[-0.5deg] after:-translate-y-1 after:bg-cyan-600", children: "Collaborate & automate" }),
          " ",
          "the $h!t🤬 out of your company"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mx-auto max-w-lg my-8", children: "Lix file manager understands changes in your files, making it easy to see detailed updates, collaborate, comment, and automate tasks directly within your documents." }),
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
          /* @__PURE__ */ jsx("h2", { className: "text-center w-full", children: "Effortless Collaboration" }),
          /* @__PURE__ */ jsx("p", { className: "text-center mt-4", children: "Sync, share, and succeed together." }),
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
            /* @__PURE__ */ jsx("h2", { className: "pt-2 md:pr-8", children: "Automations for non-techies" }),
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
            /* @__PURE__ */ jsx(Details, { summary: question.question, content: question.answer }),
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
function IconLogoTabelle() {
  return /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", height: "60", fill: "none", viewBox: "0 0 59 53", children: [
    /* @__PURE__ */ jsxs("g", { clipPath: "url(#clip0_43_216)", children: [
      /* @__PURE__ */ jsx("path", { fill: "#0EB6D4", d: "M0 0H19.607V9.804H0z" }),
      /* @__PURE__ */ jsx("path", { fill: "#0F91B1", d: "M0 9.804H19.607V19.608H0z" }),
      /* @__PURE__ */ jsx("path", { fill: "#0E7490", d: "M0 19.608H19.607V29.412H0z" }),
      /* @__PURE__ */ jsx("path", { fill: "#155E75", d: "M0 29.412H19.607V39.216H0z" }),
      /* @__PURE__ */ jsx("path", { fill: "#A2F2FC", d: "M19.607 0H39.214V9.804H19.607z" }),
      /* @__PURE__ */ jsx("path", { fill: "#25D3ED", d: "M19.607 9.804H39.214V19.608H19.607z" }),
      /* @__PURE__ */ jsx("path", { fill: "#0A91B1", d: "M19.607 19.608H39.214V29.412H19.607z" }),
      /* @__PURE__ */ jsx("path", { fill: "#155E75", d: "M19.607 29.412H39.214V39.216H19.607z" })
    ] }),
    /* @__PURE__ */ jsx(
      "rect",
      {
        width: "38.233",
        height: "38.235",
        x: "0.49",
        y: "0.49",
        stroke: "#000",
        strokeOpacity: "0.08",
        strokeWidth: "0.98",
        rx: "5.392"
      }
    ),
    /* @__PURE__ */ jsxs("g", { filter: "url(#filter0_d_43_216)", children: [
      /* @__PURE__ */ jsx(
        "rect",
        {
          width: "39.213",
          height: "17.647",
          x: "10.297",
          y: "25.98",
          stroke: "#2089AC",
          strokeWidth: "0.98",
          rx: "3.52",
          shapeRendering: "crispEdges"
        }
      ),
      /* @__PURE__ */ jsx("rect", { width: "38.188", height: "16.667", x: "10.81", y: "26.493", fill: "#0EB6D4", rx: "3.008" }),
      /* @__PURE__ */ jsx(
        "rect",
        {
          width: "37.688",
          height: "16.167",
          x: "11.06",
          y: "26.743",
          stroke: "url(#paint0_linear_43_216)",
          strokeOpacity: "0.5",
          strokeWidth: "0.5",
          rx: "2.758"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          fill: "#fff",
          d: "M14.714 38.397a.687.687 0 01-.5-.205.664.664 0 01-.205-.5.657.657 0 01.205-.493.687.687 0 01.5-.205c.188 0 .352.068.49.205a.674.674 0 01.113.85.737.737 0 01-.257.255.667.667 0 01-.346.093zm4.36-4.992v.897h-2.829v-.897h2.83zm-2.13-1.18h1.16v4.621c0 .156.023.276.07.36.05.08.114.136.193.166s.166.045.262.045c.073 0 .14-.006.2-.016.061-.01.108-.02.14-.029l.196.907c-.062.021-.151.045-.266.07-.114.026-.252.04-.417.045a1.893 1.893 0 01-.785-.131 1.221 1.221 0 01-.554-.455c-.135-.205-.201-.462-.2-.77v-4.812zm4.517 6.201c-.311 0-.592-.055-.842-.166a1.375 1.375 0 01-.59-.5c-.143-.22-.215-.492-.215-.814 0-.278.052-.508.154-.69.103-.18.243-.326.42-.435.177-.109.377-.191.6-.247.223-.057.455-.1.695-.125.288-.03.522-.056.701-.08.18-.025.31-.064.391-.115.084-.054.125-.136.125-.247v-.02c0-.24-.071-.428-.214-.56-.144-.132-.35-.199-.619-.199-.284 0-.51.062-.676.186a.922.922 0 00-.333.44l-1.084-.154c.086-.3.227-.55.424-.75.196-.203.436-.355.72-.455a2.76 2.76 0 01.943-.154c.237 0 .473.028.708.083.235.056.45.148.644.276.194.126.35.298.468.516.12.218.18.49.18.817v3.294h-1.116v-.676h-.038a1.415 1.415 0 01-.776.67c-.19.07-.413.105-.67.105zm.302-.852c.232 0 .434-.046.605-.138.171-.094.303-.218.394-.372a.947.947 0 00.141-.503v-.58a.545.545 0 01-.185.084 2.654 2.654 0 01-.289.067 8.8 8.8 0 01-.317.051 68.3 68.3 0 01-.272.039 2.026 2.026 0 00-.465.115.772.772 0 00-.324.224.548.548 0 00-.118.366c0 .213.078.374.234.483.155.11.354.164.596.164zm3.515.753v-6.563h1.16v2.455h.048c.06-.12.144-.247.253-.382.11-.136.256-.253.442-.349.186-.098.423-.147.712-.147.38 0 .723.097 1.028.291.308.193.552.478.731.856.181.376.272.837.272 1.384 0 .54-.088 1-.266 1.378a2.025 2.025 0 01-.724.865 1.862 1.862 0 01-1.038.298c-.282 0-.516-.047-.702-.14a1.429 1.429 0 01-.448-.34 2.193 2.193 0 01-.26-.382h-.067v.776h-1.141zm1.138-2.461c0 .318.044.597.134.836.092.24.223.426.394.561.173.133.383.199.628.199.257 0 .471-.069.644-.205.173-.14.304-.328.391-.568.09-.241.135-.516.135-.823a2.34 2.34 0 00-.132-.814 1.222 1.222 0 00-.39-.558 1.023 1.023 0 00-.648-.202 1.02 1.02 0 00-.631.196c-.173.13-.304.313-.394.548a2.377 2.377 0 00-.131.83zm6.674 2.557c-.494 0-.92-.102-1.279-.308a2.083 2.083 0 01-.824-.878c-.192-.38-.288-.827-.288-1.342 0-.507.096-.95.288-1.333.195-.385.466-.684.814-.898.349-.215.758-.323 1.228-.323.303 0 .59.049.858.147.272.096.511.246.718.449.21.203.374.461.494.775.12.312.18.684.18 1.115v.356h-4.035v-.782h2.922a1.248 1.248 0 00-.144-.593 1.05 1.05 0 00-.394-.413c-.167-.1-.361-.15-.583-.15a1.13 1.13 0 00-.625.172c-.18.114-.32.263-.42.45a1.29 1.29 0 00-.15.605v.682c0 .287.052.532.156.737.105.203.251.36.44.468.187.107.407.16.66.16.168 0 .321-.023.458-.07.136-.05.255-.12.355-.215.1-.094.177-.21.228-.35l1.083.123a1.69 1.69 0 01-.39.75c-.191.211-.434.376-.732.493a2.798 2.798 0 01-1.018.173zm4.33-6.659v6.563h-1.16v-6.563h1.16zm2.352 0v6.563h-1.16v-6.563h1.16zm3.372 6.659c-.493 0-.92-.102-1.278-.308a2.083 2.083 0 01-.824-.878c-.192-.38-.288-.827-.288-1.342 0-.507.096-.95.288-1.333.195-.385.466-.684.814-.898.348-.215.757-.323 1.227-.323.304 0 .59.049.86.147.27.096.51.246.717.449.21.203.374.461.494.775.12.312.179.684.179 1.115v.356h-4.035v-.782h2.923a1.249 1.249 0 00-.144-.593 1.049 1.049 0 00-.394-.413c-.167-.1-.361-.15-.584-.15a1.13 1.13 0 00-.624.172c-.18.114-.32.263-.42.45a1.29 1.29 0 00-.15.605v.682c0 .287.051.532.156.737.105.203.251.36.44.468.187.107.407.16.66.16.168 0 .32-.023.457-.07.137-.05.256-.12.356-.215.1-.094.177-.21.228-.35l1.083.123a1.688 1.688 0 01-.391.75c-.19.211-.434.376-.73.493a2.799 2.799 0 01-1.02.173z"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("defs", { children: [
      /* @__PURE__ */ jsxs(
        "filter",
        {
          id: "filter0_d_43_216",
          width: "53.918",
          height: "32.352",
          x: "4.905",
          y: "20.588",
          colorInterpolationFilters: "sRGB",
          filterUnits: "userSpaceOnUse",
          children: [
            /* @__PURE__ */ jsx("feFlood", { floodOpacity: "0", result: "BackgroundImageFix" }),
            /* @__PURE__ */ jsx(
              "feColorMatrix",
              {
                in: "SourceAlpha",
                result: "hardAlpha",
                values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              }
            ),
            /* @__PURE__ */ jsx("feOffset", { dx: "1.961", dy: "1.961" }),
            /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "3.431" }),
            /* @__PURE__ */ jsx("feComposite", { in2: "hardAlpha", operator: "out" }),
            /* @__PURE__ */ jsx("feColorMatrix", { values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" }),
            /* @__PURE__ */ jsx("feBlend", { in2: "BackgroundImageFix", result: "effect1_dropShadow_43_216" }),
            /* @__PURE__ */ jsx("feBlend", { in: "SourceGraphic", in2: "effect1_dropShadow_43_216", result: "shape" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "linearGradient",
        {
          id: "paint0_linear_43_216",
          x1: "29.904",
          x2: "29.904",
          y1: "26.493",
          y2: "43.159",
          gradientUnits: "userSpaceOnUse",
          children: [
            /* @__PURE__ */ jsx("stop", { offset: "0.365", stopColor: "#fff", stopOpacity: "0" }),
            /* @__PURE__ */ jsx("stop", { offset: "1", stopColor: "#fff" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("clipPath", { id: "clip0_43_216", children: /* @__PURE__ */ jsx("rect", { width: "39.213", height: "39.215", fill: "#fff", rx: "5.882" }) })
    ] })
  ] });
}
function IconLogoPapier() {
  return /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", height: "60", fill: "none", viewBox: "0 0 59 53", children: [
    /* @__PURE__ */ jsxs("g", { clipPath: "url(#clip0_43_227)", children: [
      /* @__PURE__ */ jsx("path", { fill: "#F6D6AF", d: "M0 0H39.216V39.216H0z" }),
      /* @__PURE__ */ jsx("path", { fill: "#F6761A", d: "M0 0H39.216V8.824H0z" }),
      /* @__PURE__ */ jsx("rect", { width: "23.529", height: "2.941", x: "3.921", y: "13.726", fill: "#F6761A", rx: "1.471" }),
      /* @__PURE__ */ jsx("rect", { width: "28.431", height: "2.941", x: "3.921", y: "18.627", fill: "#F6761A", rx: "1.471" }),
      /* @__PURE__ */ jsx("rect", { width: "14.706", height: "2.941", x: "3.921", y: "23.529", fill: "#F6761A", rx: "1.471" }),
      /* @__PURE__ */ jsx("rect", { width: "23.529", height: "2.941", x: "3.921", y: "28.431", fill: "#F6761A", rx: "1.471" })
    ] }),
    /* @__PURE__ */ jsx(
      "rect",
      {
        width: "38.235",
        height: "38.235",
        x: "0.49",
        y: "0.49",
        stroke: "#C2410B",
        strokeOpacity: "0.3",
        strokeWidth: "0.98",
        rx: "5.392"
      }
    ),
    /* @__PURE__ */ jsxs("g", { filter: "url(#filter0_d_43_227)", children: [
      /* @__PURE__ */ jsx(
        "rect",
        {
          width: "39.216",
          height: "17.647",
          x: "10.294",
          y: "25.98",
          stroke: "#C2410B",
          strokeWidth: "0.98",
          rx: "3.521",
          shapeRendering: "crispEdges"
        }
      ),
      /* @__PURE__ */ jsx("rect", { width: "38.191", height: "16.667", x: "10.807", y: "26.493", fill: "#F7761A", rx: "3.008" }),
      /* @__PURE__ */ jsx(
        "rect",
        {
          width: "37.691",
          height: "16.167",
          x: "11.057",
          y: "26.743",
          stroke: "url(#paint0_linear_43_227)",
          strokeOpacity: "0.5",
          strokeWidth: "0.5",
          rx: "2.758"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          fill: "#fff",
          d: "M15.713 38.398a.687.687 0 01-.5-.206.664.664 0 01-.205-.5.657.657 0 01.205-.493.687.687 0 01.5-.205c.188 0 .351.068.49.205a.674.674 0 01.112.85.737.737 0 01-.256.256.667.667 0 01-.347.093zm1.902 1.775v-6.768h1.141v.814h.067c.06-.12.145-.247.253-.382.11-.136.257-.253.443-.349.186-.098.423-.147.711-.147.38 0 .723.097 1.029.291.308.193.551.478.73.856.182.376.273.837.273 1.384 0 .54-.089 1-.266 1.378a2.026 2.026 0 01-.724.865 1.862 1.862 0 01-1.039.298c-.282 0-.516-.046-.701-.14a1.43 1.43 0 01-.45-.34 2.193 2.193 0 01-.259-.382h-.048v2.622h-1.16zm1.138-4.307c0 .318.045.597.134.836.092.24.224.427.395.561.173.133.382.199.628.199.256 0 .47-.069.644-.205.173-.14.303-.328.39-.567.09-.242.135-.516.135-.824a2.34 2.34 0 00-.131-.814 1.222 1.222 0 00-.391-.558 1.022 1.022 0 00-.647-.202c-.248 0-.459.066-.632.196s-.304.313-.394.548a2.375 2.375 0 00-.131.83zm5.919 2.56c-.312 0-.593-.055-.843-.166a1.375 1.375 0 01-.59-.5c-.143-.22-.215-.491-.215-.814 0-.278.052-.508.154-.69.103-.18.243-.326.42-.435.178-.109.377-.191.6-.247.224-.057.456-.099.695-.125.288-.03.522-.056.702-.08.18-.025.31-.064.39-.115.084-.054.125-.136.125-.247v-.02c0-.24-.071-.428-.214-.56-.143-.132-.35-.199-.619-.199-.284 0-.51.062-.676.186a.922.922 0 00-.333.44l-1.083-.154c.085-.3.226-.55.423-.75a1.84 1.84 0 01.72-.456 2.76 2.76 0 01.943-.153c.237 0 .473.027.708.083.235.056.45.148.644.276.195.126.35.298.468.516.12.218.18.49.18.817v3.294h-1.116v-.676h-.038a1.415 1.415 0 01-.776.67c-.19.07-.413.105-.67.105zm.3-.852c.234 0 .436-.046.607-.138.17-.094.302-.218.394-.372a.947.947 0 00.14-.503v-.58a.544.544 0 01-.185.084 2.636 2.636 0 01-.288.067c-.107.02-.213.036-.318.051l-.272.039a2.026 2.026 0 00-.465.115.771.771 0 00-.323.224.549.549 0 00-.12.366c0 .213.079.375.235.483.156.11.355.164.596.164zm3.465 2.599v-6.768h1.14v.814h.068c.06-.12.144-.247.253-.382.11-.136.257-.253.443-.349.185-.098.423-.147.711-.147.38 0 .723.097 1.029.291.307.193.55.478.73.856.182.376.273.837.273 1.384 0 .54-.089 1-.266 1.378a2.025 2.025 0 01-.724.865 1.862 1.862 0 01-1.039.298c-.282 0-.516-.046-.702-.14a1.43 1.43 0 01-.448-.34 2.193 2.193 0 01-.26-.382h-.048v2.622h-1.16zm1.138-4.307c0 .318.044.597.134.836.092.24.224.427.394.561.173.133.383.199.628.199.257 0 .472-.069.645-.205.173-.14.303-.328.39-.567.09-.242.135-.516.135-.824a2.34 2.34 0 00-.131-.814 1.222 1.222 0 00-.391-.558 1.022 1.022 0 00-.648-.202c-.247 0-.458.066-.63.196-.174.13-.305.313-.395.548a2.375 2.375 0 00-.131.83zm4.502 2.461v-4.922h1.16v4.922h-1.16zm.583-5.62a.677.677 0 01-.474-.183.59.59 0 01-.199-.446c0-.175.067-.324.199-.445a.67.67 0 01.474-.186c.186 0 .344.062.475.186.132.122.198.27.198.445a.59.59 0 01-.198.446.67.67 0 01-.475.182zm3.95 5.716c-.494 0-.92-.102-1.28-.308a2.083 2.083 0 01-.823-.878c-.192-.38-.288-.827-.288-1.342 0-.507.096-.95.288-1.333.194-.385.466-.684.814-.898.348-.215.757-.323 1.227-.323.304 0 .59.049.86.147.27.096.51.246.717.449.21.203.374.461.493.775.12.312.18.684.18 1.115v.356h-4.035v-.782h2.923a1.249 1.249 0 00-.144-.593 1.048 1.048 0 00-.395-.413c-.166-.1-.36-.15-.583-.15a1.13 1.13 0 00-.625.172c-.18.114-.319.263-.42.45a1.29 1.29 0 00-.15.605v.682c0 .287.052.532.157.737.105.203.251.36.439.468.188.107.408.16.66.16.169 0 .322-.023.458-.07.137-.05.256-.12.356-.215.1-.094.176-.21.228-.349l1.083.122a1.689 1.689 0 01-.391.75c-.19.211-.434.376-.73.493a2.799 2.799 0 01-1.02.173zm3.17-.096v-4.922h1.124v.82h.051a1.228 1.228 0 011.215-.89c.064 0 .136.002.215.009.08.004.148.012.202.022v1.068a1.22 1.22 0 00-.235-.045 2.16 2.16 0 00-.304-.023c-.211 0-.401.046-.57.138-.167.09-.298.215-.395.375-.096.16-.144.345-.144.554v2.894h-1.16z"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("defs", { children: [
      /* @__PURE__ */ jsxs(
        "filter",
        {
          id: "filter0_d_43_227",
          width: "53.921",
          height: "32.353",
          x: "4.902",
          y: "20.588",
          colorInterpolationFilters: "sRGB",
          filterUnits: "userSpaceOnUse",
          children: [
            /* @__PURE__ */ jsx("feFlood", { floodOpacity: "0", result: "BackgroundImageFix" }),
            /* @__PURE__ */ jsx(
              "feColorMatrix",
              {
                in: "SourceAlpha",
                result: "hardAlpha",
                values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              }
            ),
            /* @__PURE__ */ jsx("feOffset", { dx: "1.961", dy: "1.961" }),
            /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "3.431" }),
            /* @__PURE__ */ jsx("feComposite", { in2: "hardAlpha", operator: "out" }),
            /* @__PURE__ */ jsx("feColorMatrix", { values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" }),
            /* @__PURE__ */ jsx("feBlend", { in2: "BackgroundImageFix", result: "effect1_dropShadow_43_227" }),
            /* @__PURE__ */ jsx("feBlend", { in: "SourceGraphic", in2: "effect1_dropShadow_43_227", result: "shape" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "linearGradient",
        {
          id: "paint0_linear_43_227",
          x1: "29.902",
          x2: "29.902",
          y1: "26.493",
          y2: "43.16",
          gradientUnits: "userSpaceOnUse",
          children: [
            /* @__PURE__ */ jsx("stop", { offset: "0.365", stopColor: "#fff", stopOpacity: "0" }),
            /* @__PURE__ */ jsx("stop", { offset: "1", stopColor: "#fff" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("clipPath", { id: "clip0_43_227", children: /* @__PURE__ */ jsx("rect", { width: "39.216", height: "39.216", fill: "#fff", rx: "5.882" }) })
    ] })
  ] });
}
function IconLogoInlang() {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      xmlnsXlink: "http://www.w3.org/1999/xlink",
      height: "60",
      fill: "none",
      viewBox: "0 0 59 50",
      children: [
        /* @__PURE__ */ jsx("rect", { width: "36.364", height: "36.364", fill: "#fff", rx: "5.455" }),
        /* @__PURE__ */ jsx("rect", { width: "36.364", height: "36.364", fill: "url(#pattern0_43_232)", rx: "5.455" }),
        /* @__PURE__ */ jsxs("g", { filter: "url(#filter0_d_43_232)", children: [
          /* @__PURE__ */ jsx(
            "rect",
            {
              width: "36.364",
              height: "16.364",
              x: "13.182",
              y: "24.091",
              stroke: "#000",
              strokeWidth: "0.909",
              rx: "3.264",
              shapeRendering: "crispEdges"
            }
          ),
          /* @__PURE__ */ jsx("rect", { width: "35.413", height: "15.455", x: "13.657", y: "24.566", fill: "#50595D", rx: "2.789" }),
          /* @__PURE__ */ jsx(
            "rect",
            {
              width: "34.95",
              height: "14.991",
              x: "13.889",
              y: "24.798",
              stroke: "url(#paint0_linear_43_232)",
              strokeOpacity: "0.5",
              strokeWidth: "0.464",
              rx: "2.557"
            }
          ),
          /* @__PURE__ */ jsx(
            "path",
            {
              fill: "#fff",
              d: "M18.579 36.323a.637.637 0 01-.464-.19.616.616 0 01-.19-.464.609.609 0 01.19-.457.637.637 0 01.464-.19c.174 0 .325.063.454.19a.625.625 0 01.104.787.684.684 0 01-.237.238.62.62 0 01-.321.086zm1.764-.065v-4.565h1.076v4.565h-1.076zm.54-5.213a.627.627 0 01-.439-.169.546.546 0 01-.184-.413c0-.162.061-.3.184-.413a.621.621 0 01.44-.172c.172 0 .319.057.44.172a.54.54 0 01.184.413c0 .16-.062.298-.184.413a.621.621 0 01-.44.17zm2.718 2.538v2.675h-1.076v-4.565h1.028v.776h.053c.105-.256.273-.459.503-.61.231-.15.518-.225.858-.225.315 0 .59.067.824.202.235.135.418.33.546.585.131.256.195.566.193.93v2.907h-1.075v-2.74c0-.305-.08-.544-.238-.716-.156-.173-.373-.259-.65-.259a1 1 0 00-.503.125.865.865 0 00-.342.354 1.194 1.194 0 00-.122.561zm5.099-3.411v6.086h-1.076v-6.086H28.7zm2.42 6.178c-.29 0-.55-.052-.782-.155a1.275 1.275 0 01-.547-.463c-.133-.204-.2-.456-.2-.755 0-.258.048-.47.143-.639.095-.168.225-.303.39-.404.164-.101.35-.177.555-.229a4.52 4.52 0 01.645-.116c.268-.028.484-.052.65-.074a.966.966 0 00.363-.107c.078-.05.116-.126.116-.229v-.018c0-.224-.066-.397-.199-.52s-.324-.184-.573-.184c-.264 0-.473.057-.627.172a.855.855 0 00-.31.407l-1.004-.142c.08-.277.21-.51.393-.695.182-.189.405-.33.668-.422.264-.096.555-.143.874-.143.22 0 .439.026.656.077.218.052.417.137.598.256.18.117.325.276.434.478.11.202.166.455.166.758v3.055h-1.034v-.627h-.036a1.314 1.314 0 01-.719.62 1.784 1.784 0 01-.62.099zm.278-.79c.216 0 .404-.043.562-.129a.945.945 0 00.366-.344.878.878 0 00.13-.467v-.538a.505.505 0 01-.172.078c-.08.024-.168.044-.267.062a8.15 8.15 0 01-.295.048l-.252.035c-.16.022-.304.058-.431.107a.715.715 0 00-.3.208.508.508 0 00-.11.339c0 .198.072.348.217.449a.943.943 0 00.552.151zm4.288-1.977v2.675h-1.075v-4.565h1.028v.776h.053c.105-.256.273-.459.502-.61.232-.15.518-.225.86-.225.314 0 .589.067.822.202.236.135.418.33.547.585.13.256.195.566.193.93v2.907h-1.075v-2.74c0-.305-.08-.544-.238-.716-.157-.173-.374-.259-.65-.259a1 1 0 00-.503.125.865.865 0 00-.342.354 1.194 1.194 0 00-.122.561zm6.009 4.481c-.386 0-.718-.052-.996-.157a1.768 1.768 0 01-.668-.416 1.439 1.439 0 01-.35-.58l.968-.234c.043.089.107.177.19.264.083.09.195.162.336.22.142.06.322.09.538.09.305 0 .557-.075.757-.224.2-.146.3-.388.3-.725v-.865h-.053a1.527 1.527 0 01-.244.342 1.247 1.247 0 01-.419.294c-.172.08-.389.12-.65.12-.351 0-.669-.083-.954-.247a1.769 1.769 0 01-.678-.743c-.166-.331-.25-.745-.25-1.242 0-.502.084-.925.25-1.27.169-.346.395-.608.68-.787.286-.18.604-.27.955-.27.267 0 .487.046.66.137.173.089.312.197.415.323.103.125.181.243.235.354h.06v-.755h1.06v4.639c0 .39-.093.713-.28.969-.185.255-.44.446-.763.573a2.99 2.99 0 01-1.1.19zm.009-2.716a1 1 0 00.582-.166c.16-.111.282-.27.366-.479.083-.208.124-.457.124-.748 0-.288-.041-.54-.124-.755a1.078 1.078 0 00-.363-.502.938.938 0 00-.585-.182c-.24 0-.44.063-.6.188-.161.124-.282.296-.363.514a2.083 2.083 0 00-.122.737c0 .279.04.524.122.734.083.208.205.37.365.487.163.115.362.172.598.172z"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("defs", { children: [
          /* @__PURE__ */ jsx("pattern", { id: "pattern0_43_232", width: "1", height: "1", patternContentUnits: "objectBoundingBox", children: /* @__PURE__ */ jsx("use", { transform: "scale(.00293)", xlinkHref: "#image0_43_232" }) }),
          /* @__PURE__ */ jsxs(
            "filter",
            {
              id: "filter0_d_43_232",
              width: "50",
              height: "30",
              x: "8.182",
              y: "19.091",
              colorInterpolationFilters: "sRGB",
              filterUnits: "userSpaceOnUse",
              children: [
                /* @__PURE__ */ jsx("feFlood", { floodOpacity: "0", result: "BackgroundImageFix" }),
                /* @__PURE__ */ jsx(
                  "feColorMatrix",
                  {
                    in: "SourceAlpha",
                    result: "hardAlpha",
                    values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  }
                ),
                /* @__PURE__ */ jsx("feOffset", { dx: "1.818", dy: "1.818" }),
                /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "3.182" }),
                /* @__PURE__ */ jsx("feComposite", { in2: "hardAlpha", operator: "out" }),
                /* @__PURE__ */ jsx("feColorMatrix", { values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" }),
                /* @__PURE__ */ jsx("feBlend", { in2: "BackgroundImageFix", result: "effect1_dropShadow_43_232" }),
                /* @__PURE__ */ jsx("feBlend", { in: "SourceGraphic", in2: "effect1_dropShadow_43_232", result: "shape" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "linearGradient",
            {
              id: "paint0_linear_43_232",
              x1: "31.363",
              x2: "31.363",
              y1: "24.566",
              y2: "40.02",
              gradientUnits: "userSpaceOnUse",
              children: [
                /* @__PURE__ */ jsx("stop", { offset: "0.365", stopColor: "#fff", stopOpacity: "0" }),
                /* @__PURE__ */ jsx("stop", { offset: "1", stopColor: "#fff" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "image",
            {
              id: "image0_43_232",
              width: "341",
              height: "341",
              xlinkHref: "data:image/png;base64,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"
            }
          )
        ] })
      ]
    }
  );
}
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
    title: "Fully understands changes",
    description: "Lix does not save versions; it provides access to each individual change in a file."
  },
  {
    title: "File agnostic",
    description: "Lix can understand any file format with the help of plugins."
  },
  {
    title: "Apps with change control",
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
const appsBuiltOnTopOfLix = [
  {
    title: "Table-App",
    link: "https://csv-n2qj.onrender.com/",
    icon: /* @__PURE__ */ jsx(IconLogoTabelle, {}),
    description: "Get change control in your CSV file editor."
  },
  {
    title: "Text-Editor",
    link: "https://opral.substack.com/p/collaborative-markdown-with-lix-change",
    icon: /* @__PURE__ */ jsx(IconLogoPapier, {}),
    description: "Take notes and collaborate with change control."
  },
  {
    title: "Translation-App",
    link: "https://fink2.onrender.com",
    icon: /* @__PURE__ */ jsx(IconLogoInlang, {}),
    description: "Collaborate on translations with change control."
  }
];
const faq = [
  {
    question: "How is it different from my current file-sharing solution?",
    answer: "Your current file-sharing solution may show which of your colleagues made the last change to a file, but you don't know what changed, what the previous version was and what the context of the changes was."
  },
  {
    question: "How does it compare to versioning I know from other apps?",
    answer: "There are apps with versioning, but in many cases, they only save versions of the entire project at specific points in time. Lix tracks and understands the context of every change in a file, giving you more context and allowing you to set automations. Furthermore, Lix provides a generalized system that allows all files and apps to work together."
  },
  {
    question: "Is lix replacing git?",
    answer: "No. Lix is designed to change control non-text files and build apps, not version source code."
  }
];
function Index() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Banner, {}),
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsxs("main", { className: "w-full max-w-5xl px-4 mx-auto space-y-16 md:space-y-24", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 justify-center md:justify-start gap-16 md:gap-8 lg:gap-24 mt-12 mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "max-w-md", children: [
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", { className: "text-5xl leading-[1.2] font-semibold", children: "The worlds first change control system" }) }),
          /* @__PURE__ */ jsx("p", { className: "mt-8 mb-6", children: "The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang." }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap-reverse items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/app/fm",
                className: "w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2 transition-all",
                children: "Open File Manager"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://github.com/opral/monorepo/tree/lix-integration/packages/lix-sdk",
                target: "_blank",
                className: "w-full sm:w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex justify-center items-center gap-2 border border-slate-300 hover:border-slate-400 transition-all",
                children: "Explore the lix SDK"
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
        /* @__PURE__ */ jsx("h2", { className: "text-center", children: "Enabled by change control" }),
        /* @__PURE__ */ jsx("p", { className: "max-w-md text-center mt-2 mb-8", children: "Every app built on top of Lix comes with differentiating features out of the box." }),
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
        /* @__PURE__ */ jsx("h2", { className: "text-center", children: "How to experience the system?" }),
        /* @__PURE__ */ jsx("p", { className: "max-w-md text-center mt-2 mb-8", children: "Change control can be accessed in file-based applications that are already built on Lix or the Lix File Manager, which can track changes of conventional files." }),
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
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "w-full my-12 md:my-16 relative flex items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute w-fit left-0 right-0 mx-auto bg-white font-semibold text-slate-500 px-6", children: "Apps that built on top of Lix" }),
          /* @__PURE__ */ jsx("div", { className: "w-full border-b border-slate-200" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 w-full", children: appsBuiltOnTopOfLix.map((app, index) => /* @__PURE__ */ jsxs(
          "a",
          {
            href: app.link,
            className: "relative card font-semibold gap-4 w-full group",
            children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-[14px] md:top-6 right-[14px] md:right-6 flex justify-center items-center w-10 h-10 rounded-full bg-white text-slate-500 transition-all ring-1 ring-slate-200 group-hover:text-cyan-500  group-hover:ring-cyan-500", children: /* @__PURE__ */ jsx("div", { className: "transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", children: /* @__PURE__ */ jsx(IconArrowExternal, {}) }) }),
              /* @__PURE__ */ jsx("div", { children: app.icon }),
              /* @__PURE__ */ jsx("div", { className: "mt-4", children: app.title }),
              /* @__PURE__ */ jsx("p", { className: "font-normal mt-1", children: app.description })
            ]
          },
          index
        )) }),
        /* @__PURE__ */ jsx("div", { className: "card relative w-full mt-4", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end sm:items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "SDK to build Apps on Lix" }),
            /* @__PURE__ */ jsx("p", { className: "pt-1", children: "Build your own apps with the Lix SDK to access change control features." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "w-fit whitespace-nowrap bg-white ring-1 ring-slate-200 px-4 py-2 rounded-full", children: "Coming soon" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-8 md:gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 md:col-span-1", children: [
          /* @__PURE__ */ jsx("h2", { children: "Open questions?" }),
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
          /* @__PURE__ */ jsx(Details, { summary: question.question, content: question.answer }),
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
const serverManifest = { "entry": { "module": "/assets/entry.client-CZKf3RLx.js", "imports": ["/assets/components-7JiR4bbM.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-iPUA1yy4.js", "imports": ["/assets/components-7JiR4bbM.js"], "css": ["/assets/root-D5TafMW6.css"] }, "routes/file-manager": { "id": "routes/file-manager", "parentId": "root", "path": "file-manager", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/file-manager-WIRaP1du.js", "imports": ["/assets/components-7JiR4bbM.js", "/assets/details-B17gBefg.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-Cx8TPMky.js", "imports": ["/assets/components-7JiR4bbM.js", "/assets/details-B17gBefg.js"], "css": [] } }, "url": "/assets/manifest-28cfd770.js", "version": "28cfd770" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": false, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
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
