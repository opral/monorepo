import { Helmet } from 'react-helmet-async';
import Header, { socialLinks } from "../components/header";
import Check from "../components/ui/check";
import IconArrowExternal from "../components/icons/arrow-external";
import Details from "../components/ui/details";
import IconLogoTabelle from "../components/icons/logo-tabelle";
import IconLogoPapier from "../components/icons/logo-papier";
import IconLogoInlang from "../components/icons/logo-inlang";
import Footer from "../components/footer";
import { Link } from 'react-router-dom';

const coreFeatures = [
  {
    title: "Tracks changes",
    description: "Lix provides change control for every file stored in lix.",
  },
  {
    title: "File agnostic",
    description: "Lix can understand any file format with the help of plugins.",
  },
  {
    title: "Designed to build apps",
    description: "Lix enables file-based apps with change control features.",
  },
];

const enabledByChangeControl = [
  {
    title: "Collaboration",
    list: ["Sync & async workflows", "Change proposals", "Review changes"],
    image: "/images/collaboration.svg",
  },
  {
    title: "Automation",
    list: ["Build pipelines", "Validation rules"],
    image: "/images/automation.svg",
  },
  {
    title: "Change Graph",
    list: ["Traceability", "Auditing", "Recovery"],
    image: "/images/change-graph.svg",
  },
];

const appsBuiltOnTopOfLix = [
  {
    title: "CSV App",
    link: "https://lix.host/app/csv",
    icon: <IconLogoTabelle />,
    description: "Get change control in your CSV file editor.",
  },
  {
    title: "Text-Editor",
    link: "https://lix.host/app/flashtype",
    icon: <IconLogoPapier />,
    description: "Take notes and collaborate with change control.",
  },
  {
    title: "Translation-App",
    link: "https://fink2.onrender.com",
    icon: <IconLogoInlang />,
    description: "Collaborate on translations with change control.",
  },
];

const faq = [
  {
    question: "Is lix replacing git?",
    answer:
      "No. Lix is designed for everything but software engineering. This is reflected by being browser-based, and being able to track changes in any file format, not just text files.",
  },
  {
    question: "How does it compare to versioning I know from other apps?",
    answer:
      "There are apps with versioning, but in many cases, they only save versions of the entire project at specific points in time. Lix tracks and understands the context of every change in a file, giving you more context and allowing you to set automations. Furthermore, Lix provides a generalized system that allows all files and apps to work together.",
  },
  {
    question:
      "What is the difference between restore a Version and revert a change?",
    answer:
      "Restoring a version replaces the current document with an older snapshot, erasing all subsequent changes, while reverting a change precisely undoes a specific modification while preserving all later work. Essentially, restore is an all-or-nothing replacement, and revert is a targeted undo.",
  },
];

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Lix - Change Control System</title>
        <meta name="description" content="The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang." />
        <meta name="keywords" content="change control, file-based apps, collaboration, automation, change graph" />
        
        <meta property="og:url" content="https://lix.opral.com" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Lix - Change Control System" />
        <meta property="og:description" content="The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang." />
        <meta property="og:image" content="https://lix.opral.com/images/og-image-lix.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        <meta name="twitter:card" content="Change graph of the lix change control system" />
        <meta property="twitter:url" content="https://lix.opral.com" />
        <meta name="twitter:title" content="Lix - Change Control System" />
        <meta name="twitter:description" content="The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang." />
        <meta name="twitter:image:src" content="https://lix.opral.com/images/og-image-lix.png" />
      </Helmet>
      
      <Header />
      <main className="w-full max-w-5xl px-4 mx-auto space-y-16 md:space-y-20">
        <div className="grid md:grid-cols-2 justify-center md:justify-start gap-16 md:gap-8 lg:gap-24 mt-12 mb-12">
          <div className="max-w-md">
            <div className="flex gap-2 mb-2 justify-center md:justify-start">
              <a
                href="https://www.npmjs.com/package/@lix-js/sdk"
                target="_blank"
              >
                <img
                  src="https://img.shields.io/npm/dw/%40lix-js%2Fsdk?logo=npm&logoColor=red&label=npm%20downloads"
                  alt="npm downloads"
                />
              </a>
              <a href="https://discord.gg/xjQA897RyK" target="_blank">
                <img
                  src="https://img.shields.io/discord/897438559458430986?style=flat&logo=discord&labelColor=white"
                  alt="discord"
                />
              </a>
            </div>
            <div>
              <h1 className="text-5xl leading-[1.2] font-semibold">
                A change control system & SDK
              </h1>
            </div>
            <p className="mt-8 mb-6">
              The lix SDK for change control allows storing, tracking, querying,
              and reviewing changes in different file formats, e.g. .xlsx,
              .sqlite, or .inlang.
            </p>
            <div className="flex flex-wrap-reverse items-center gap-2">
              <a
                href="https://lix.host/app/fm"
                className="w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2 transition-all"
              >
                Try the demo
              </a>
              <a
                href="https://github.com/opral/monorepo/tree/main/packages/lix-sdk"
                target="_blank"
                className="w-full sm:w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex justify-center items-center gap-2 border border-slate-300 hover:border-slate-400 transition-all"
              >
                SDK documentation
              </a>
            </div>
          </div>
          <div>
            {coreFeatures.map((feature, index) => (
              <div key={index} className="my-4 max-w-sm flex items-start gap-5">
                <Check />
                <div className="space-y-1">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-center">Built apps with the lix SDK</h2>
          <p className="max-w-2xl text-center mt-4 mb-8">
            The lix SDK can be intergated into exsiting apps, or used as backend
            for new apps.{" "}
            <a
              href="https://github.com/opral/lix-sdk"
              className="text-cyan-600"
            >
              Visit the documentation for more information.
            </a>
          </p>
          <a href="https://github.com/opral/lix-sdk">
            <img
              src="/images/code-example.png"
              alt="Simlified sketch of the lix file manager"
              className="mb-2 sm:-mb-10 w-[724x] md:h-[300px] mt-4 mx-auto"
            />
          </a>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-center">Everything revolves around changes</h2>
          <p className="max-w-2xl text-center mt-4 mb-8">
            A system, that can track changes across any file format is one
            single system that enables collaboration, automation, and
            traceability for every digital work we create.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {enabledByChangeControl.map((feature, index) => (
              <div
                key={index}
                className="card flex flex-col items-start gap-2 mx-auto w-full sm:w-fit md:w-full"
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="self-center w-[240px] h-[200px]"
                />
                <h3 className="font-semibold">{feature.title}</h3>
                <ul className="list-disc list-inside flex flex-col gap-0.5">
                  {feature.list.map((item, index) => (
                    <li key={index} className="list-item text-slate-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-center">Try the demo</h2>
          <p className="max-w-lg text-center mt-4 mb-8">
            The file manager app is a demo of the lix change control system.
            Import files, make changes, and see the change control in action.
          </p>
          <div className="card relative w-full group cursor-pointer">
            <Link to="/file-manager">
              <img
                src="/images/file-manager.svg"
                alt="Simlified sketch of the lix file manager"
                className="mb-2 sm:-mb-10 w-[724x] md:h-[300px] mt-4 mx-auto"
              />
              <div className="flex justify-between items-end gap-2">
                <div>
                  <span className="font-semibold">Lix File Manager</span>
                  <p className="mt-1">All your files under change control.</p>
                </div>
                <div className="absolute bottom-[14px] md:bottom-6 right-[14px] md:right-6 flex justify-center items-center w-10 h-10 rounded-full bg-white text-slate-500 transition-all ring-1 ring-slate-200 group-hover:text-cyan-500  group-hover:ring-cyan-500">
                  <div className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <IconArrowExternal />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <hr />

        <div className="grid md:grid-cols-3 gap-8 md:gap-4">
          <div className="col-span-2 md:col-span-1">
            <h2>FAQ</h2>
            <div className="mt-4 flex gap-2">
              {socialLinks
                .map((socialLink, index) => (
                  <a
                    key={index}
                    href={socialLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-all w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex items-center gap-2 border border-slate-300 hover:border-slate-400"
                  >
                    {socialLink.text}
                  </a>
                ))
                .slice(0, 2)}
            </div>
          </div>
          <div className="md:mt-3 col-span-2 space-y-3 md:space-y-6">
            {faq.map((question, index) => (
              <div key={index}>
                <Details
                  summary={question.question}
                  content={question.answer}
                />
                {faq.length - 1 !== index && (
                  <div className="mt-3 md:mt-6 border-b border-slate-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 max-w-xl md:mx-auto pl-4 md:pl-16 border-l-2 border-surface-200">
          <p className="italic text-slate-800">
            "Every work that we create, every time we collaborate, everything we
            automate, it revolves around changes. A system, that can understand
            changes and inform you about that these changes happened, means that
            you have a system to collaborate, validate, automate and create."
          </p>
          <p>
            Samuel Stroschein,{" "}
            <span className="whitespace-nowrap">
              Founder of Opral (lix & inlang)
            </span>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}