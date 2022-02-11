/* eslint-disable react/jsx-no-target-blank */
import Link from "next/link";

const Hero = () => {
  return (
    <div className="px-4 pt-16 pb-8 sm:px-6 sm:pt-24 lg:px-8  ">
      <h1 className="text-center text-6xl font-extrabold tracking-tighter leading-[1.1] sm:text-7xl lg:text-8xl xl:text-8xl">
        Translate your software product <br className="hidden lg:block" />
        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 ">
          2x faster.
        </span>{" "}
      </h1>
      <p className="max-w-lg mx-auto mt-6 text-xl font-medium leading-tight text-center text-current  sm:max-w-4xl sm:text-2xl md:text-3xl lg:text-4xl">
        Inlang is an open source localization solution for software.
      </p>
      <div className="max-w-xl mx-auto mt-5 sm:flex sm:justify-center md:mt-8 gap-3">
        <div className="rounded-md ">
          <Link href="/docs/getting-started">
            <a className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white no-underline bg-black border border-transparent rounded-md dark:bg-white dark:text-black betterhover:dark:hover:bg-gray-300 betterhover:hover:bg-gray-700 md:py-3 md:text-lg md:px-10 md:leading-6">
              Get started →
            </a>
          </Link>
        </div>
        <div className="relative mt-3 rounded-md sm:mt-0 sm:ml-3">
          <a
            href="https://github.com/inlang/inlang"
            target="_blank"
            className="no-underline flex items-center justify-center w-full px-8 py-3 font-mono text-sm font-medium text-gray-600 bg-black border border-transparent border-gray-200 rounded-md bg-opacity-5 dark:bg-white dark:text-gray-300 dark:border-gray-700 dark:bg-opacity-5 betterhover:hover:bg-gray-50 betterhover:dark:hover:bg-gray-900 md:py-3 md:text-base md:leading-6 md:px-10"
          >
            View the source code
          </a>
        </div>
      </div>
    </div>
  );
};

export default Hero;
