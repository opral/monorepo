type LegacyRedirect = {
  uid: string;
  to: string;
  statusCode: 301 | 302;
};

const legacyRedirects: LegacyRedirect[] = [
  {
    uid: "dxnzrydw",
    to: "/m/gerre34r/library-inlang-paraglideJs/sveltekit",
    statusCode: 301,
  },
  {
    uid: "osslbuzt",
    to: "/m/gerre34r/library-inlang-paraglideJs/next-js",
    statusCode: 301,
  },
  {
    uid: "iljlwzfs",
    to: "/m/gerre34r/library-inlang-paraglideJs/astro",
    statusCode: 301,
  },
];

export function getLegacyRedirect(uid: string) {
  return legacyRedirects.find((entry) => entry.uid === uid);
}
