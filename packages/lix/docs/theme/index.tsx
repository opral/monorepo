import React from "react";
import { getCustomMDXComponent as baseGetCustomMDXComponent } from "@rspress/core/theme";
import { LlmsContainer, LlmsCopyButton } from "@rspress/plugin-llms/runtime";

/**
 * Light-mode-only placeholder to remove the default theme switcher.
 *
 * @example
 * // Render nothing in the nav bar
 * <SwitchAppearance />
 */
export const SwitchAppearance = () => null;

export function getCustomMDXComponent(): ReturnType<
  typeof baseGetCustomMDXComponent
> {
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
