// set search params

type SearchParams = {
  search?: string;
  id?: string[];
  lint?: `${string}.${string}`[];
  lang?: string[];
  branch?: string;
  project?: string;
  ref?: string;
};

type SearchType = {
  key: "search";
  value: string;
};

type BranchType = {
  key: "branch";
  value: string;
};

type ProjectType = {
  key: "project";
  value: string;
};

type idType = {
  key: "id";
  value: string[];
};

type LintType = {
  key: "lint";
  value: `${string}.${string}`[];
};

type LangType = {
  key: "lang";
  value: string[];
};

type RefType = {
  key: "ref";
  value: string;
};

type SearchParamsType =
  | SearchType
  | LintType
  | LangType
  | idType
  | BranchType
  | ProjectType
  | RefType;

export const setSearchParams = ({ key, value }: SearchParamsType) => {
  //get url from window
  const currentUrl = new URL(window.location.href);

  //extract search params from url
  const searchParamsObj: SearchParams = {
    search: currentUrl.searchParams.get("search") || "",
    id: currentUrl.searchParams.getAll("id"),
    branch: currentUrl.searchParams.get("branch") || "",
    project: currentUrl.searchParams.get("project") || "",
    lint: currentUrl.searchParams.getAll("lint") as `${string}.${string}`[],
    lang: currentUrl.searchParams.getAll("lang"),
    ref: currentUrl.searchParams.get("ref") || "",
  };

  //set search params in object
  switch (key) {
    case "search":
      searchParamsObj.search = value as string;
      break;
    case "id":
      searchParamsObj.id = [];
      searchParamsObj.id = [...value];
      break;
    case "lint":
      searchParamsObj.lint = [];
      searchParamsObj.lint = [...value];
      break;
    case "branch":
      searchParamsObj.branch = value;
      break;
    case "lang":
      searchParamsObj.lang = [];
      searchParamsObj.lang = [...value];
      break;
    case "project":
      searchParamsObj.project = value;
      break;
  }

  //put search params in new url
  const newUrl = new URL(
    location.protocol + "//" + location.host + location.pathname,
  );
  const currentParams = newUrl.searchParams;
  for (const [key, value] of Object.entries(searchParamsObj)) {
    if (typeof value === "string") {
      // for search and id
      if (value && value !== "") {
        currentParams.append(key, value as string);
      }
    } else {
      // for lint and lang
      if (value.length > 0) {
        value.map((val: string) => {
          currentParams.append(key, val);
        });
      }
    }
  }

  newUrl.search = currentParams.toString();
  if (window.location.href !== newUrl.href) {
    window.history.replaceState({}, "", newUrl);
  }
};
