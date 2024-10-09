import type { MetaFunction } from "@remix-run/node";
import Header from "../components/header";
import Footer from "../components/footer";
import Check from "~/components/ui/check";

export const meta: MetaFunction = () => {
  return [
    { title: "Lix - Change Control System" },
    { name: "description", content: "The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang." },
  ];
};

const coreFeatures = [
  {
    title: "Fully understands changes",
    description: "Store your files in the lix change control system and keep track of all changes.",
  },
  {
    title: "File agnostic",
    description: "Track changes in your files to see what has been changed, added, or removed.",
  },
  {
    title: "Apps with change control",
    description: "Query changes in your files to find specific changes or changes by a specific user.",
  },
];

const enabledByChangeControl = [
  {
    title: "Collaboration",
    list: [
      "Sync & async workflows",
      "Change proposals",
      "Review changes",
    ],
    image: "/images/collaboration.svg"
  },
  {
    title: "Automation",
    list: [
      "Build pipelines",
      "Validation rules",
    ],
    image: "/images/automation.svg"
  },
  {
    title: "Change Graph",
    list: [
      "Traceability",
      "Auditing",
      "Recovery",
    ],
    image: "/images/change-graph.svg"
  }
];

export default function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="w-full max-w-5xl px-4 mx-auto space-y-16">
        <div className="grid grid-cols-2 gap-24 mt-12 mb-12">
          <div>
            <div>
              <h1 className="text-5xl font-semibold">The change control system for files</h1>
              {/* files */}
              {/* <span className="text-5xl font-semibold">
                files
              </span> */}
            </div>
            <p className="text-slate-500 mt-8 mb-6">
              The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang.
            </p>
            <a
              href="https://opral.substack.com/"
              target="_blanc"
              className="w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold flex items-center gap-2"
            >
              Get updates
            </a>
          </div>
          <div>
            {coreFeatures.map((feature, index) => (
              <div key={index} className="mb-4 max-w-md flex items-start gap-5">
                <Check />
                <div className="space-y-1">
                  <h2 className="font-semibold">{feature.title}</h2>
                  <p className="text-slate-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-semibold">Enabled by change control</h2>
          <p className="max-w-md text-slate-500 text-center mt-2 mb-8">The lix change control system allows storing, tracking, querying, and reviewing changes in different file.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {enabledByChangeControl.map((feature, index) => (
              <div key={index} className="flex flex-col items-start gap-4 p-8 bg-slate-100 rounded">
                <img src={feature.image} alt={feature.title} className="w-[240px] h-[200px]" />
                <h3 className="font-semibold">{feature.title}</h3>
                <ul className="list-disc flex flex-col gap-2">
                  {feature.list.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <p className="text-slate-500">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-semibold">How to experience the system?</h2>
          <p className="max-w-md text-slate-500 text-center mt-2 mb-6">The lix change control system allows storing, tracking, querying, and reviewing changes in different file.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
