import type { MetaFunction } from "@remix-run/node";
import Header from "../components/header";
import Footer from "../components/footer";
import Check from "~/components/ui/check";
import IconArrowExternal from "~/components/icons/arrow-external";

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

const appsBuiltOnTopOfLix = [
  {
    title: "Table-App",
    link: "https://csv-n2qj.onrender.com/"
  },
  {
    title: "Text-Editor",
    link: "https://opral.substack.com/p/collaborative-markdown-with-lix-change"
  },
  {
    title: "Translation-App",
    link: "fink2.onrender.com"
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
            <p className="mt-8 mb-6">
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
              <div key={index} className="mb-4 max-w-sm flex items-start gap-5">
                <Check />
                <div className="space-y-1">
                  <h2 className="font-semibold">{feature.title}</h2>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-semibold">Enabled by change control</h2>
          <p className="max-w-md text-center mt-2 mb-8">The lix change control system allows storing, tracking, querying, and reviewing changes in different file.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {enabledByChangeControl.map((feature, index) => (
              <div key={index} className="card flex flex-col items-start gap-3 w-full">
                <img src={feature.image} alt={feature.title} className="w-[240px] h-[200px]" />
                <h3 className="font-semibold">{feature.title}</h3>
                <ul className="list-disc list-inside flex flex-col gap-0.5">
                  {feature.list.map((item, index) => (
                    <li key={index} className="list-item text-slate-500">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-semibold">How to experience the system?</h2>
          <p className="max-w-md text-center mt-2 mb-8">The lix change control system allows storing, tracking, querying, and reviewing changes in different file.</p>
          <div className="card relative w-full">
            <img src="/images/file-manager.svg" alt="Simlified sketch of the lix file manager" className="w-[724x] h-[300px] mt-4 -mb-10 mx-auto" />
            <span className="font-semibold">Lix file manager</span>
            <p>The lix change control system allows storing, tracking, querying.</p>
            <p className="absolute right-6 bottom-6 w-fit bg-white ring ring-1 ring-slate-200 px-4 py-2 rounded-full">Coming soon</p>
          </div>

          <div className="w-full my-16 relative flex items-center">
            <div className="absolute w-fit left-0 right-0 mx-auto bg-white font-semibold text-slate-500 px-6">
              Apps that built on top of Lix
            </div>
            <div className="w-full border-b border-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {appsBuiltOnTopOfLix.map((app, index) =>
              <a
                key={index}
                href={app.link}
                className="relative card font-semibold gap-4 w-full"
              >
                <div className="absolute top-4 right-4 flex justify-center items-center w-10 h-10 rounded-full bg-white text-slate-500 ring ring-1 ring-slate-200">
                  <IconArrowExternal />
                </div>
                <div className="mt-10">{app.title}</div>
              </a>
            )}
          </div>

          <div className="card relative w-full mt-4">
            <span className="font-semibold">SDK to build Apps on Lix</span>
            <p>The lix change control system allows storing, tracking, querying.</p>
            <p className="absolute right-6 bottom-6 w-fit bg-white ring ring-1 ring-slate-200 px-4 py-2 rounded-full">Coming soon</p>
          </div>
        </div>


      </main>
      <Footer />
    </div>
  );
}
