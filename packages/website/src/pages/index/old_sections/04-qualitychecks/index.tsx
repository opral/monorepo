import { Button } from "../../components/Button.jsx";
import { SectionLayout } from "../../components/sectionLayout.jsx";
import Exclamation from "~icons/material-symbols/error-outline";
import Check from "~icons/material-symbols/check-circle-outline";
import AutoResolve from "./assets/autoresolve.jsx";

const QualityChecks = () => {
  return (
    <>
      <SectionLayout showLines={true} type="lightGrey">
        <div class="w-full flex pt-4 flex-col-reverse xl:flex-row pb-16">
          <div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:py-16 pt-8 md:pt-20 mt-8 py-6 items-start">
            <h3 class="font-semibold text-3xl">Team-wide quality checks</h3>
            <p>
              Quality checks that <b>could</b> be automated, <b>should</b> be
              automated with rules and fixes.
            </p>
            <Button type="primary" chevron>
              Search for rules
            </Button>
            <div class="grid md:grid-cols-2 gap-8 mt-16 grid-cols-1">
              <div>
                <div class="bg-[#D97706] text-[#D97706] w-16 h-16 p-2 rounded-md bg-opacity-10">
                  <Exclamation class="w-full h-full" />
                </div>
                <p class="font-semibold mt-5 mb-3">Create rules</p>
                <p>
                  Add checks to your project and automatically highlight errors
                  when they happen.
                </p>
              </div>
              <div>
                <div class="bg-[#3FB950] text-[#3FB950] w-16 h-16 p-2 rounded-md bg-opacity-10">
                  <Check class="w-full h-full" />
                </div>
                <p class="font-semibold mt-5 mb-3">Resolve problems</p>
                <p>
                  Provide rules with a recommended fixes and apply them manually
                  or automatically.
                </p>
              </div>
            </div>
          </div>
          <div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:py-16 pt-20 py-6 mx-auto max-w-xl">
            <AutoResolve />
          </div>
        </div>
      </SectionLayout>
    </>
  );
};

export default QualityChecks;
