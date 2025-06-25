import { createPlatePlugin } from '@udecode/plate/react';
import { EmptyDocumentPromptElement } from '@/components/editor/empty-document-prompt-element';

export const EMPTY_DOCUMENT_PROMPT_KEY = 'empty-document-prompt';

export const EmptyDocumentPromptPlugin = createPlatePlugin({
  key: EMPTY_DOCUMENT_PROMPT_KEY,
  node: {
    component: EmptyDocumentPromptElement,
    isElement: true,
    isVoid: true,
    isInline: false,
    type: EMPTY_DOCUMENT_PROMPT_KEY,
  },
});