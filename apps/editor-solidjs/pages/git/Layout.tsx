import { For, JSXElement } from "solid-js";
import { searchParameters } from "./state";

export function Layout(props: { children: JSXElement }) {
  return (
    <>
      <Breadcrumbs></Breadcrumbs>
      {props.children}
    </>
  );
}

function Breadcrumbs() {
  // ugly stitching together of paths
  // let breadcrumbs: () => { name: string; href: string; isCurrentPage: boolean }[];
  function breadcrumbs() {
    // consists of last two paths (/) of the uri (skipping https:// etc.)
    const respositoryName = window.location.pathname
      .split("/")
      .slice(-2)
      .join(" ");
    if (searchParameters.directory === "/") {
      return [
        {
          name: respositoryName,
          href: `/git/${window.location.pathname}`,
          isCurrentPage: true,
        },
      ];
    }
    const result = [
      {
        name: respositoryName,
        href: `/git/${window.location.pathname}`,
        isCurrentPage: false,
      },
    ];
    for (const [i, subpath] of searchParameters.directory
      .split("/")
      .slice(1, -1)
      .entries()) {
      // the path(s) "above" the subpath
      // .slice(1) to remove prefixed slash as in the each loop above
      const rootpath = searchParameters.directory
        .split("/")
        .slice(1)
        .slice(0, i)
        .join("/");
      //  if roothpath exists ? merge paths : else only take subpath
      const dir = rootpath ? `/${rootpath}/${subpath}/` : `/${subpath}/`;
      // ugly slicing of slashes
      let isCurrentPage =
        searchParameters.directory.slice(
          searchParameters.directory.slice(0, -1).lastIndexOf("/") + 1,
          -1
        ) === subpath;
      result.push({
        name: subpath,
        href: `/git/${window.location.pathname}?dir=${dir}`,
        isCurrentPage,
      });
    }
    return result;
  }

  return (
    <div class="border px-4 py-2 rounded">
      <sl-breadcrumb>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="w-6 h-6 pr-2"
        >
          <path
            fill-rule="evenodd"
            d="M3 2.75A2.75 2.75 0 015.75 0h14.5a.75.75 0 01.75.75v20.5a.75.75 0 01-.75.75h-6a.75.75 0 010-1.5h5.25v-4H6A1.5 1.5 0 004.5 18v.75c0 .716.43 1.334 1.05 1.605a.75.75 0 01-.6 1.374A3.25 3.25 0 013 18.75v-16zM19.5 1.5V15H6c-.546 0-1.059.146-1.5.401V2.75c0-.69.56-1.25 1.25-1.25H19.5z"
          />
          <path d="M7 18.25a.25.25 0 01.25-.25h5a.25.25 0 01.25.25v5.01a.25.25 0 01-.397.201l-2.206-1.604a.25.25 0 00-.294 0L7.397 23.46a.25.25 0 01-.397-.2v-5.01z" />
        </svg>
        <For each={breadcrumbs()}>
          {(breadcrumb) => (
            <sl-breadcrumb-item prop:href={breadcrumb.href}>
              {breadcrumb.name}
            </sl-breadcrumb-item>
          )}
        </For>
      </sl-breadcrumb>
    </div>
  );
}
