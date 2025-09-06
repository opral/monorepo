import { Button } from "@/components/ui/button.tsx";
import IconLightning from "@/components/icons/IconLightning.tsx";
import IconAdd from "@/components/icons/IconAdd.tsx";
import IconCondition from "@/components/icons/IconCondition.tsx";
import IconCheckCircle from "@/components/icons/IconCheckCircle.tsx";
import IconMinus from "@/components/icons/IconMinus.tsx";
import React from "react";

interface AutomationConfigProps {
  trigger: () => React.ReactNode;
  condition: () => React.ReactNode;
  action: () => React.ReactNode;
}

interface AutomationConfigItemProps {
  type: "trigger" | "condition" | "action";
  input: React.ReactNode;
}

const AutomationConfig = ({ trigger, condition, action }: AutomationConfigProps) => {
  return (
    <div className="flex flex-col gap-2.5">
      <AutomationConfigItem type="trigger" input={trigger()} />
      <AutomationConfigItem type="condition" input={condition()} />
      <AutomationConfigItem type="action" input={action()} />
    </div>
  );
}

const AutomationConfigItem = ({ type, input }: AutomationConfigItemProps) => {
  return (
    <div>
      <div className="flex justify-between items-center px-5 py-1.5">
        <div className="flex gap-3">
          {/* if else for trigger, condition and action */}
          <>
            {type === "trigger" ? (
              <>
                <IconLightning /> Trigger
              </>
            ) : type === "condition" ? (
              <>
                <IconCondition /> Condition
              </>
            ) : (
              <>
                <IconCheckCircle /> Action
              </>
            )}
          </>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          {type === "trigger" && <Button variant="secondary">Test</Button>}
          <Button variant="ghost" size="icon">
            <IconAdd />
          </Button>
        </div>
      </div>
      <div className="ml-14 my-1.5 mr-5 flex gap-3">
        <div className="flex-grow ring-1 ring-slate-200 rounded-md px-3 py-1.5">
          {input}
        </div>
        <Button variant="ghost" size="icon">
          <IconMinus />
        </Button>
      </div>
    </div>
  );
}

export default AutomationConfig;