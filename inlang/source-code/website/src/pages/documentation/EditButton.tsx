import Link from "#src/renderer/Link.jsx";
import EditOutline from "~icons/material-symbols/edit-outline-rounded";

interface EditButtonProps {
  href: string | undefined;
}

export function EditButton(props: EditButtonProps) {
  return (
    <div class="w-full max-sm:pb-8 flex justify-between">
      <Link
        href={props.href}
        class="text-info/80 hover:text-info/100 text-sm font-semibold flex items-center"
        target="_blank"
      >
        <EditOutline class="inline-block mr-2" />
        Edit on GitHub
      </Link>
    </div>
  );
}
