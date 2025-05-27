import { IconBrandDiscord, IconBrandGithub } from "@tabler/icons-react";

const Footer = () => {
  return (
    <footer className="py-12 relative">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center px-4">
        <div className="flex items-center justify-center space-x-10 mb-8">
          {/* Discord */}
          <a
            href="https://discord.gg/CNPfhWpcAa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-200 relative group"
            aria-label="Join our Discord"
          >
            <IconBrandDiscord size={24} stroke={1.5} />
            <div className="absolute -inset-2 bg-yellow-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/opral/monorepo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-200 relative group"
            aria-label="View on GitHub"
          >
            <IconBrandGithub size={24} stroke={1.5} />
            <div className="absolute -inset-2 bg-yellow-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>

          {/* Lix link */}
          <a
            href="https://lix.opral.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-200 relative group"
            aria-label="Visit Lix"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 26 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-current"
            >
              <path
                d="M14.7618 5.74842L16.9208 9.85984L22.3675 0.358398H25.7133L19.0723 11.6284L22.5712 17.5085H19.2407L16.9208 13.443L14.6393 17.5085H11.2705L14.7618 11.6284L11.393 5.74842H14.7618Z"
                fill="currentColor"
              />
              <path
                d="M6.16211 17.5081V5.74805H9.42368V17.5081H6.16211Z"
                fill="currentColor"
              />
              <path
                d="M3.52112 0.393555V17.6416H0.287109V0.393555H3.52112Z"
                fill="currentColor"
              />
              <path
                d="M6.21582 0.393555H14.8399V3.08856H6.21582V0.393555Z"
                fill="currentColor"
              />
            </svg>
            <div className="absolute -inset-2 bg-yellow-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
        </div>

        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Flashtype. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
