type LegacyRedirect = {
  uid: string;
  href: string;
  statusCode: 301 | 302;
};

const legacyRedirects: LegacyRedirect[] = [
  {
    uid: "dxnzrydw",
    href: "https://paraglidejs.com/sveltekit",
    statusCode: 301,
  },
  {
    uid: "osslbuzt",
    href: "https://paraglidejs.com/next-js",
    statusCode: 301,
  },
  {
    uid: "iljlwzfs",
    href: "https://paraglidejs.com/astro",
    statusCode: 301,
  },
];

export function getLegacyRedirect(uid: string) {
  return legacyRedirects.find((entry) => entry.uid === uid);
}

/**
 * Marketplace items that have their own website. Their inlang.com pages
 * permanently redirect to that website instead of rendering a copy of it.
 */
type StandaloneSite = {
  uid: string;
  slug: string;
  href: string;
  /**
   * Whether marketplace sub pages exist on the standalone site under the same
   * path (e.g. `/m/gerre34r/library-inlang-paraglideJs/comparison` ->
   * `https://paraglidejs.com/comparison`). Otherwise, every page redirects to
   * the website's root.
   */
  preservePath: boolean;
};

const standaloneSites: StandaloneSite[] = [
  {
    uid: "gerre34r",
    slug: "library-inlang-paraglideJs",
    href: "https://paraglidejs.com",
    preservePath: true,
  },
  {
    uid: "tdozzpar",
    slug: "app-inlang-finkLocalizationEditor",
    href: "https://fink.inlang.com",
    preservePath: false,
  },
];

export function getStandaloneSiteRedirect(uid: string, pagePath: string = "/") {
  const site = standaloneSites.find((entry) => entry.uid === uid);
  if (!site) return undefined;
  const normalized = !site.preservePath || pagePath === "/" ? "" : pagePath;
  return {
    href: `${site.href}${normalized}`,
    statusCode: 301 as const,
  };
}

export function getStandaloneSiteRedirectForPath(pathname: string) {
  const legacyRedirect = legacyRedirects.find((entry) =>
    pathname.startsWith(`/m/${entry.uid}/`),
  );
  if (legacyRedirect) {
    return {
      href: legacyRedirect.href,
      statusCode: legacyRedirect.statusCode,
    };
  }

  for (const site of standaloneSites) {
    const basePath = `/m/${site.uid}/${site.slug}`;
    if (pathname === basePath || pathname === `${basePath}/`) {
      return getStandaloneSiteRedirect(site.uid);
    }
    if (pathname.startsWith(`${basePath}/`)) {
      return getStandaloneSiteRedirect(
        site.uid,
        pathname.slice(basePath.length),
      );
    }
  }

  return undefined;
}
