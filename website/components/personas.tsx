const Personas = () => {
  return (
    // -mx-20 to escape the boundries of the theme
    <div className="grid gap-6 grid-flow-row lg:-mx-20">
      <div>
        <OnePersona
          title="Developers"
          subheader="Get more productive with inlangs developer tools."
          features={
            <>
              {" "}
              <Feature
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                }
                title="Translation Extraction"
              />
              <Feature
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                }
                title="Inline Annotations"
              />
              <Feature
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                }
                title="Works Independent of the Dashboard"
              />
            </>
          }
        >
          <img src="images/vscode-inline-annotation.webp"></img>
        </OnePersona>
      </div>
      <div>
        <OnePersona
          title="Translators"
          subheader="Manage translations without touching source code."
          features={
            <>
              {" "}
              <Feature
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                }
                title="UI for Managing Translations"
              />
              <Feature
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                }
                title="Sync with Source Code"
              />
            </>
          }
        >
          <img src="images/dashboard-example.webp"></img>
        </OnePersona>
      </div>
      <div className="lg:col-span-2">
        <OnePersona
          title="Product Managers"
          subheader="Ship your product faster."
        >
          <div className="flex pt-6 gap-4 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
            <div className="text-4xl font-bold italic">
              Automate your translation pipeline.
            </div>
          </div>
        </OnePersona>
      </div>
    </div>
  );
};

const OnePersona = ({
  title,
  subheader,
  features,
  children,
}: {
  title: string;
  subheader: string;
  features?: any;
  children: any;
}) => {
  return (
    <div className="flex flex-col border border-gray-200 dark:border-gray-500 rounded-md p-4 w-full h-full">
      <div className="text-3xl font-bold">{title}</div>
      <div className="pt-2"></div>
      <div className="text-xl font-medium">{subheader}</div>
      {features && (
        <div className="flex gap-x-6 gap-y-4 py-6 flex-wrap">{features}</div>
      )}
      <div className="h-full flex items-center">{children}</div>
    </div>
  );
};

const Feature = ({ icon, title }: any) => {
  return (
    <div className="flex gap-2 items-center">
      {icon}
      <div className="text-lg font-medium">{title}</div>
    </div>
  );
};

export default Personas;
