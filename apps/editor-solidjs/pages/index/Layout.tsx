import { createSignal, JSXElement } from "solid-js";

/**
 * Same padding across nav bar and container
 */
const paddingXAxis = "px-2 md:px-4";

export function Layout(props: { children: JSXElement }) {
  return (
    <>
      <Navbar></Navbar>
      <div
        class={`container mx-auto space-y-2 my-2 ${paddingXAxis} bg-background text-on-background`}
      >
        {props.children}
      </div>
      {/* empty footer for now but with height acting as "margin */}
      <footer class="h-10"></footer>
    </>
  );
}

function Navbar() {
  const [showHamburgerMenu, setShowHamburgerMenu] = createSignal(false);

  return (
    <nav class="bg-surface-100 text-on-surface text-body-md font-body-md  py-2.5 border-b">
      <div
        class={`container ${paddingXAxis} flex flex-wrap justify-between items-center mx-auto`}
      >
        <a href="/" class="flex items-center text-headline-sm">
          Inlang
        </a>
        {/* hamburger menu on mobile  */}
        <button
          type="button"
          class="inline-flex items-center p-2 ml-3 text-headline-sm text-on-surface rounded-lg md:hidden hover:hover-on-surface focus:outline-none focus:ring-2 focus:focus-on-surface"
          aria-controls="mobile-menu"
          aria-expanded="false"
          onClick={() => setShowHamburgerMenu(!showHamburgerMenu())}
        >
          <span class="sr-only">Open main menu</span>
          <svg
            class="w-6 h-6"
            classList={{ hidden: showHamburgerMenu() === true }}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            class="w-6 h-6"
            classList={{ hidden: showHamburgerMenu() === false }}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <div
          class="w-full md:block md:w-auto"
          classList={{ hidden: showHamburgerMenu() === false }}
        >
          <ul class="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0">
            {/* empty nav links */}
          </ul>
        </div>
      </div>
    </nav>
  );
}
