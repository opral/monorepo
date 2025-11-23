import React from "react";
import {
  getCustomMDXComponent as baseGetCustomMDXComponent,
  type RspressMDXComponents,
} from "@rspress/core/theme";
import { LlmsContainer, LlmsCopyButton } from "@rspress/plugin-llms/runtime";

export function getCustomMDXComponent(): RspressMDXComponents {
  const components = baseGetCustomMDXComponent();

  return {
    ...components,
    h1: (props) => (
      <div className="llms-heading-row">
        {components.h1?.(props)}
        <LlmsContainer className="llms-heading-actions">
          <LlmsCopyButton />
        </LlmsContainer>
      </div>
    ),
  };
}

export * from "@rspress/core/theme";
