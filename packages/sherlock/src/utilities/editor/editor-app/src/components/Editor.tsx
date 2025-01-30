import './App.css';
import { BundleNested, ProjectSettings } from '@inlang/sdk';
import { vscode } from '../utils/vscode';
import React, { FormEvent } from 'react';
import { InlangAddSelector, InlangMessage, InlangPatternEditor, InlangVariant, InlangBundle } from '@inlang/editor-component';
import {
  SlDialog
} from "@shoelace-style/shoelace/dist/react";
import { createComponent } from '@lit/react';

const Editor = ({ bundle, settings, setShowHistory }: {
  bundle: BundleNested;
  settings: ProjectSettings;
  setShowHistory: (variantId: string) => void;
}) => {
  const ReactInlangBundle = createComponent({
    tagName: "inlang-bundle",
    elementClass: InlangBundle,
    react: React,
    events: {
      change: "change",
    },
  });

  const ReactInlangMessage = createComponent({
    tagName: "inlang-message",
    elementClass: InlangMessage,
    react: React,
  });

  const ReactInlangVariant = createComponent({
    tagName: "inlang-variant",
    elementClass: InlangVariant,
    react: React,
  });

  const ReactInlangPatternEditor = createComponent({
    tagName: "inlang-pattern-editor",
    elementClass: InlangPatternEditor,
    react: React,
    events: {
      onPatternEditorFocus: "pattern-editor-focus",
      onPatternEditorBlur: "pattern-editor-blur",
    },
  });

  const ReactInlangAddSelector = createComponent({
    tagName: "inlang-add-selector",
    elementClass: InlangAddSelector,
    react: React,
    events: {
      change: "change",
      onSubmit: "submit",
    },
  });

  const handleChangeEvent = (e: FormEvent<HTMLElement>) => {
    console.log('bundleChange', e);
    vscode.postMessage({ type: 'bundleChange', bundle });
  };

  return (
    <ReactInlangBundle bundle={bundle} onChange={handleChangeEvent}>
      {bundle.messages.map((message) => (
        <ReactInlangMessage
          key={message.id}
          slot="message"
          message={message}
          variants={message.variants}
          settings={settings}
        >
          {message.variants.map((variant) => (
            <ReactInlangVariant key={variant.id} slot="variant" variant={variant}>
              <ReactInlangPatternEditor slot="pattern-editor" variant={variant} />
              {/* Show "Add Selector" only if there's no selector and a single variant */}
              {message.selectors?.length === 0 && message.variants.length <= 1 ? (
                <>
                  <div slot="variant-action" onClick={() => setShowHistory(variant.id)}>
                    Add selector
                  </div>
                  <SlDialog slot="variant-action" label="Add Selector">
                    <ReactInlangAddSelector
                      bundle={bundle}
                      message={message}
                      variants={message.variants}
                    />
                  </SlDialog>
                </>
              ) : null}
            </ReactInlangVariant>
          ))}

          <div slot="selector-button" className="add-selector" onClick={() => setShowHistory(message.id)}>
            Add selector
          </div>
          <SlDialog slot="selector-button" label="Add Selector">
            <ReactInlangAddSelector
              bundle={bundle}
              message={message}
              variants={message.variants}
            />
          </SlDialog>
        </ReactInlangMessage>
      ))}
    </ReactInlangBundle>
  );
};

export default Editor;
