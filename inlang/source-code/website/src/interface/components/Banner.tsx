import Arrow from "~icons/material-symbols/arrow-forward-rounded";

/**
 * Displays a small banner on top of the navigation.
 */
export function Banner(props: {
  text: string;
  href: string;
  customClasses?: string;
}) {
  return (
    <a
      href={props.href}
      class="w-full group"
      target={props.href.includes("http") ? "_blank" : ""}
    >
      <div class="w-full py-1 px-2 transition-all bg-gradient-to-r from-[#BBCFF3] via-[#0BB5D4] to-[#3590ED]">
        <p
          class={`text-sm group-hover:opacity-80 transition-opacity px-2 py-2 rounded-full w-full max-w-xl mx-auto text-background font-medium ${props.customClasses}`}
        >
          {props.text}
          <Arrow class="ml-1.5 w-4.5 h-4.5 rounded-full inline-flex items-center justify-center transition-all group-hover:bg-background group-hover:text-[#0BB5D4] left-0 group-hover:left-1 relative bottom-0.5" />
        </p>
      </div>
    </a>
  );
}
