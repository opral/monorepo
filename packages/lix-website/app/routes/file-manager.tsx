import { MetaFunction } from "@remix-run/node";
import Footer from "app/components/footer";
import Header, { socialLinks } from "app/components/header";
import IconArrowExternal from "app/components/icons/arrow-external";
import IconBranch from "app/components/icons/branch";
import IconConversation from "app/components/icons/conversation";
import IconLix from "app/components/icons/lix";
import IconSync from "app/components/icons/sync";
import Check from "app/components/ui/check";
import Details from "app/components/ui/details";

export const meta: MetaFunction = () => {
  const ogImage = [
    {
      property: "og:url",
      content: "https://lix.opral.com/file-manager",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:title",
      content: "Lix file manager",
    },
    {
      property: "og:description",
      content:
        "Lix file manager understands changes in your files, making it easy to see detailed updates, collaborate, comment, and automate tasks directly within your documents.",
    },
    {
      property: "og:image",
      content: "https://lix.opral.com/images/og-image-lix.png",
    },
    {
      property: "og:image:type",
      content: "image/png",
    },
    {
      property: "og:image:width",
      content: "1200",
    },
    {
      property: "og:image:height",
      content: "630",
    },
    {
      name: "twitter:card",
      content: "Lix file manager with build-in change control",
    },
    {
      property: "twitter:url",
      content: "https://lix.opral.com/",
    },
    {
      name: "twitter:title",
      content: "Lix file manager",
    },
    {
      name: "twitter:description",
      content:
        "Lix file manager understands changes in your files, making it easy to see detailed updates, collaborate, comment, and automate tasks directly within your documents.",
    },
    {
      name: "twitter:image:src",
      content: "https://lix.opral.com/images/og-image-lix.png",
    },
  ];

  return [
    { title: "Lix file manager" },
    {
      name: "description",
      content:
        "The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g. .xlsx, .sqlite, or .inlang.",
    },
    {
      name: "keywords",
      content:
        "change control, file-based apps, collaboration, automation, change graph",
    },
    ...ogImage,
  ];
};

const faq = [
  {
    question: "When will this be available for general use?",
    answer:
      "Lix is currently in the closed beta phase, where we're actively refining features based on user feedback. We’re excited to announce a launch event on December 16th. Sign up to join and be among the first to experience the release!",
  },
  {
    question: "How does this integrate with my already existing software?",
    answer:
      "Lix is file-based, meaning you can seamlessly use your preferred applications alongside Lix’s internal tools. For instance, you can edit a CSV file in Numbers or Excel, and once you're done, simply upload it back to the Lix file manager. Lix will automatically understand the changes you made.",
  },
  {
    question: "Where does my data get stored?",
    answer:
      "By default, your data is stored locally on your device, allowing for full offline support out of the box. Your files are only synced with other users or cloud storage when you choose to do so, ensuring complete control over your data.",
  },
  {
    question: "How Lix compare to Git / version control?",
    answer:
      "Lix focuses on simplifying file management and collaboration, especially for non-developers. Read more about that in on lix.opral.com",
  },
  {
    question: "Is Lix free or do I need to buy it?",
    answer:
      "The private beta will be completely free to use. As we approach the official launch, we’re still finalizing future pricing plans.",
  },
  {
    question: "Does Lix also work with AI?",
    answer:
      "Yes! Lix offers a flexible automation surface where you can connect any AI API of your choice. Additionally, native AI features are on our roadmap.",
  },
];

const automatedTasks = [
  {
    title: "Build pipelines",
  },
  {
    title: "Quality checks",
  },
  {
    title: "Connect external APIs",
  },
];

const collaborationFeatures = [
  {
    title: "Sync your lix with others",
    description:
      "Easily share your Lix with others to keep everyone on the same page.",
    icon: <IconSync />,
  },
  {
    title: "Create and share proposals",
    description:
      "Draft proposals, gather feedback, and refine your ideas—all in one platform.",
    icon: <IconBranch />,
  },
  {
    title: "Achieve quality through review",
    description:
      "Collaborate with your team to review files, make edits, and ensure top-notch quality.",
    icon: <IconConversation />,
  },
];

const createFeatures = [
  {
    title: "Drop your files",
    description: "Simply drag and drop your files into Lix's file manager.",
  },
  {
    title: "Get change control",
    description:
      "Lix automatically tracks all changes, allowing you to trace edits, recover previous versions, and collaborate seamlessly.",
  },
];

export default function FileManager() {
  return (
    <>
      <div className="w-full bg-slate-50">
        <Header />
      </div>
      <main>
        <div className="w-full h-fit bg-slate-50 p-4 slanted">
          <div className="mx-auto max-w-2xl justify-center items-center text-center mt-16 mb-48">
            <div className="mx-auto flex items-center gap-2 w-fit p-2 text-slate-500 ring-1 ring-slate-200 rounded-md mb-4 bg-white">
              <div className="bg-slate-200 p-1.5 py-1 w-fit rounded">
                <IconLix className="w-4 h-4 text-slate-500" />
              </div>
              The Lix File Manager App
            </div>
            <h1 className="text-3xl sm:text-5xl leading-[1.2] font-semibold">
              Manage files, changes, and automations in your lix.
            </h1>
            <p className="mx-auto max-w-lg my-8">
              {/* The lix file manager makes it easy to manage files, changes, and
              automations in a lix. */}
            </p>
            <div className="flex flex-col sm:flex-row justify-center w-full gap-2">
              <a
                href="/app/fm"
                className="w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2 transition-all"
              >
                Try it out
              </a>
              <a
                href="https://opral.substack.com/"
                target="_blank"
                className="w-full sm:w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex justify-center items-center gap-2 ring-1 ring-slate-300 hover:ring-slate-400 transition-all"
              >
                Get updates
              </a>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto px-4 space-y-16 sm:space-y-24 md:space-y-32">
          <div className="w-full -mb-32 aspect-[1.48/1] sm:aspect-[2.1/1] relative">
            <div className="-mt-32 ring-1 ring-slate-200 bg-slate-100 rounded-2xl p-2 absolute">
              <img
                className="hidden sm:block rounded-xl ring-1 ring-slate-200"
                src="/images/lix-fm.svg"
                alt="Lix File Manager"
              />
              <img
                className="sm:hidden rounded-xl ring-1 ring-slate-200"
                src="/images/lix-fm-mobile.svg"
                alt="Lix File Manager"
              />
            </div>
          </div>

          <div className="flex flex-wrap md:grid grid-cols-12 gap-4 md:gap-8 sm:gap-4">
            <div className="md:col-span-5">
              <h2 className="mt-2">Create</h2>
              <p className="mt-4 sm:w-4/5 md:w-full">
                Create with the freedom of change control. Trace, recover or
                simple read the history like a book to be always on track.
              </p>
              <div className="sm:grid md:block grid-cols-2 gap-4 md:gap-8">
                {createFeatures.map((feature, index) => (
                  <div key={index} className="my-6 max-w-sm flex gap-5">
                    <div className="space-y-1.5">
                      <div className="rounded-sm px-0.5 py-0.5 bg-slate-100 w-8 text-center text-slate-700 text-sm font-medium">
                        0{index + 1}
                      </div>
                      <h3 className="font-medium pt-2">{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-7 pr-4 sm:pr-8 pt-4 sm:pt-7 h-fit self-end bg-slate-100 rounded-lg ring-1 ring-slate-200 overflow-clip flex items-end">
              <img
                className="ring-1 ring-slate-200 rounded-tr-lg"
                src="/images/fm-create.svg"
                alt="File Manager Features"
              />
            </div>
          </div>

          <div>
            <h2 className="text-center w-full">Collaboration</h2>
            <p className="text-center mt-4">Sync, share, and work together.</p>
            <div className="my-8 pt-4 sm:pt-7 px-4 sm:px-8 bg-slate-100 rounded-lg ring-1 ring-slate-200 overflow-x-auto flex justify-center">
              <div className="flex gap-4 sm:gap-5">
                <img
                  className="ring-1 ring-slate-200 rounded-t-lg sm:rounded-br-none w-[300px] sm:w-[320px]"
                  src="/images/fm-collaborate-1.svg"
                  alt="File Manager Automate"
                />
                <img
                  className="ring-1 ring-slate-200 rounded-t-lg sm:rounded-bl-none w-[300px] sm:w-[320px]"
                  src="/images/fm-collaborate-2.svg"
                  alt="File Manager Automate"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-8 sm:gap-4">
              {collaborationFeatures.map((feature, index) => (
                <div key={index}>
                  {feature.icon}
                  <h3 className="mt-4 font-medium">{feature.title}</h3>
                  <p className="mt-2">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:grid sm:grid-cols-12 gap-8 sm:gap-4">
            <div className="col-span-8 px-4 pt-4 sm:px-7 sm:pt-7 sm:mr-5 h-fit w-fit flex justify-center items-end bg-slate-100 rounded-lg ring-1 ring-slate-200 overflow-clip self-end">
              <img
                className="ring-1 ring-slate-200 rounded-t-lg"
                src="/images/fm-automate.svg"
                alt="File Manager Automate"
              />
            </div>
            <div className="col-span-4 col-start-9">
              <h2 className="pt-2 md:pr-8">Automations</h2>
              <p className="mt-4">
                Link automations to file changes, making it easy to configure
                pipelines, run quality checks, and integrate APIs—all triggered
                automatically.
              </p>
              <div className="pt-4 flex flex-col gap-4">
                {automatedTasks.map((feature, index) => (
                  <div key={index} className="max-w-sm flex items-start gap-5">
                    <Check />
                    <div className="space-y-1">
                      <h3 className="font-medium">{feature.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-4">
            <div className="col-span-2 sm:col-span-1">
              <h2>Open questions?</h2>
              <div className="mt-4 flex gap-2">
                {socialLinks
                  .map((socialLink, index) => (
                    <a
                      key={index}
                      href={socialLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-all w-fit px-4 py-2 text-slate-500 bg-white hover:bg-slate-100 rounded-md font-medium flex items-center gap-2 ring-1 ring-slate-300 hover:ring-slate-400"
                    >
                      {socialLink.text}
                    </a>
                  ))
                  .slice(0, 2)}
              </div>
            </div>
            <div className="sm:mt-3 col-span-2 space-y-3 sm:space-y-6">
              {faq.map((question, index) => (
                <div key={index}>
                  <Details
                    summary={question.question}
                    content={question.answer}
                  />
                  {faq.length - 1 !== index && (
                    <div className="mt-3 sm:mt-6 border-b border-slate-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="w-full ring-1 ring-slate-200 rounded-xl flex flex-col md:grid md:grid-cols-3 gap-4 overflow-clip">
            <div className="p-4 sm:p-8 flex flex-col justify-between">
              <div className="w-full">
                <h2 className="text-xl pt-2">Stay in the loop</h2>
                <p className="mt-4 sm:w-4/5 md:w-full">
                  Sign up to receive updates about lix and its file manager.
                </p>
              </div>
              <a
                href="https://opral.substack.com/"
                target="_blank"
                className="mt-4 w-full sm:w-fit px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md font-medium flex justify-center items-center gap-2 transition-all"
              >
                Get update
              </a>
            </div>
            <div className="col-span-2 pl-4 sm:pl-8 md:pt-8 flex items-end">
              <img
                className="w-full ring-1 ring-slate-200 rounded-tl-lg"
                src="/images/fm-waitlist.svg"
                alt="File Manager Waitlist"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
