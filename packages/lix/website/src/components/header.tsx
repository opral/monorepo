import { Link } from "@tanstack/react-router";

/**
 * Lix logo used across the site.
 *
 * @example
 * <LixLogo className="h-6 w-6" />
 */
export const LixLogo = ({ className = "" }) => (
  <svg
    width="30"
    height="22"
    viewBox="0 0 26 18"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g id="Group 162">
      <path
        id="Vector"
        d="M14.7618 5.74842L16.9208 9.85984L22.3675 0.358398H25.7133L19.0723 11.6284L22.5712 17.5085H19.2407L16.9208 13.443L14.6393 17.5085H11.2705L14.7618 11.6284L11.393 5.74842H14.7618Z"
        fill="currentColor"
      />
      <path
        id="Vector_2"
        d="M6.16211 17.5081V5.74805H9.42368V17.5081H6.16211Z"
        fill="currentColor"
      />
      <path
        id="Vector_3"
        d="M3.52112 0.393555V17.6416H0.287109V0.393555H3.52112Z"
        fill="currentColor"
      />
      <path
        id="Rectangle 391"
        d="M6.21582 0.393555H14.8399V3.08856H6.21582V0.393555Z"
        fill="currentColor"
      />
    </g>
  </svg>
);

/**
 * GitHub mark icon used in the site header.
 *
 * @example
 * <GitHubIcon className="h-5 w-5" />
 */
export const GitHubIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.21.68-.47v-1.69c-2.78.6-3.37-1.34-3.37-1.34a2.64 2.64 0 00-1.1-1.46c-.9-.62.07-.6.07-.6a2.08 2.08 0 011.52 1 2.1 2.1 0 002.87.82 2.11 2.11 0 01.63-1.32c-2.22-.25-4.56-1.11-4.56-4.95a3.88 3.88 0 011-2.7 3.6 3.6 0 01.1-2.67s.84-.27 2.75 1a9.5 9.5 0 015 0c1.91-1.29 2.75-1 2.75-1a3.6 3.6 0 01.1 2.67 3.87 3.87 0 011 2.7c0 3.85-2.34 4.7-4.57 4.95a2.37 2.37 0 01.68 1.84v2.72c0 .27.18.57.69.47A10 10 0 0012 2z" />
  </svg>
);

/**
 * Discord icon used in the site header.
 *
 * @example
 * <DiscordIcon className="h-5 w-5" />
 */
export const DiscordIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 71 55"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9793C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5574C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.3052 54.5131 18.363 54.4376C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0527 48.4172 21.9931 48.2735 21.8674 48.2259C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5033 16.1789 45.3039 16.3116 45.2082C16.679 44.9293 17.0464 44.6391 17.4034 44.346C17.4654 44.2947 17.5534 44.2843 17.6228 44.3189C29.2558 49.8743 41.8354 49.8743 53.3179 44.3189C53.3873 44.2817 53.4753 44.292 53.5401 44.3433C53.8971 44.6364 54.2645 44.9293 54.6346 45.2082C54.7673 45.3039 54.7594 45.5033 54.6195 45.5858C52.8508 46.6197 51.0121 47.4931 49.0775 48.223C48.9518 48.2706 48.894 48.4172 48.956 48.5383C50.0198 50.6034 51.2372 52.5699 52.5872 54.4347C52.6414 54.5131 52.7423 54.5477 52.8347 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5574C70.6559 45.5182 70.6894 45.459 70.695 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9821C60.1772 4.9429 60.1436 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.2012 37.3253C43.7029 37.3253 40.8203 34.1136 40.8203 30.1693C40.8203 26.225 43.6469 23.0133 47.2012 23.0133C50.7833 23.0133 53.6379 26.2532 53.5819 30.1693C53.5819 34.1136 50.7833 37.3253 47.2012 37.3253Z" />
  </svg>
);

/**
 * X (formerly Twitter) icon used in the site header.
 *
 * @example
 * <XIcon className="h-5 w-5" />
 */
export const XIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 1227"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z" />
  </svg>
);

const navLinks = [
  { href: "/docs/hello-490j9s", label: "Docs" },
  { href: "/plugins/", label: "Plugins" },
  { href: "/docs/hello-490j9s", label: "API Reference" },
];

const socialLinks = [
  {
    href: "https://github.com/opral/lix-sdk",
    label: "GitHub",
    Icon: GitHubIcon,
    sizeClass: "h-5 w-5",
  },
  {
    href: "https://discord.gg/gdMPPWy57R",
    label: "Discord",
    Icon: DiscordIcon,
    sizeClass: "h-5 w-5",
  },
  {
    href: "https://x.com/lixCCS",
    label: "X",
    Icon: XIcon,
    sizeClass: "h-4 w-4",
  },
];

/**
 * Site header with logo, navigation, and social links.
 *
 * @example
 * <Header />
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center text-[#0891B2]"
          aria-label="lix home"
        >
          <LixLogo className="h-7 w-7" />
          <span className="sr-only">lix</span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-4 text-sm font-medium text-gray-700 sm:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href + label}
                to={href}
                className="transition-colors hover:text-[#0692B6]"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ href, label, Icon, sizeClass }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 transition-colors hover:text-[#0692B6]"
                aria-label={label}
              >
                <Icon className={sizeClass ?? "h-5 w-5"} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
