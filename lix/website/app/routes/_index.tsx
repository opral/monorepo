import type { MetaFunction } from "@remix-run/node";
import Footer from "../components/footer";
import Header from "../components/header";

export const meta: MetaFunction = () => {
  return [
    { title: "Lix - Change Control System" },
    { name: "description", content: "The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang." },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      {/* <Footer /> */}
    </div>
  );
}
