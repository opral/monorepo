import type { MetaFunction } from "@remix-run/node";
import Footer from "../components/footer";
import Header from "../components/header";

type UseCase = {
  title: string
  year: number
  link: string
}

type BlogPost = {
  title: string
  link: string
}

export const meta: MetaFunction = () => {
  return [
    { title: "Lix - Change Control System" },
    { name: "description", content: "The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang." },
  ];
};

const useCases: Array<UseCase> = [
  {
    title: "Fink - Change Control in Translation Management Systems",
    year: 2024,
    link: "https://opral.substack.com/cp/146431448",
  },
  {
    title: "Collaborative Markdown with Lix Change Control",
    year: 2024,
    link: "https://opral.substack.com/p/collaborative-markdown-with-lix-change",
  },
]


const blogPosts: Array<BlogPost> = [
  {
    title: "July 2024 update",
    link: "https://opral.substack.com/p/july-2024-update",
  },
  {
    title: "Accelerate by years part IV - The prototype",
    link: "https://opral.substack.com/p/accelerate-by-years-iv-the-prototype",
  },
  {
    title: "Accelerate by years part III - Lix on SQLite",
    link: "https://opral.substack.com/p/accelerate-by-years-part-iii-lix",
  },
  {
    title: "Accelerate by years part II - Self-contained inlang files",
    link: "https://opral.substack.com/p/accelerate-by-years-part-ii-self",
  },
  {
    title: "Accelerate by years part I - Inlang directories as lix repositories",
    link: "https://opral.substack.com/p/accelerate-by-years-part-i-inlang",
  },
  {
    title: "June 2024 update",
    link: "https://opral.substack.com/p/june-2024-update",
  },
]

export default function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      {/* <Footer /> */}
    </div>
  );
}
