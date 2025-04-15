declare module 'react-helmet-async' {
  import React from 'react';

  export interface HelmetProps {
    [key: string]: any;
  }

  export interface HelmetServerState {
    base: { toString(): string; toComponent(): React.ReactElement };
    bodyAttributes: { toString(): string; toComponent(): React.ReactElement };
    htmlAttributes: { toString(): string; toComponent(): React.ReactElement };
    link: { toString(): string; toComponent(): React.ReactElement };
    meta: { toString(): string; toComponent(): React.ReactElement };
    noscript: { toString(): string; toComponent(): React.ReactElement };
    script: { toString(): string; toComponent(): React.ReactElement };
    style: { toString(): string; toComponent(): React.ReactElement };
    title: { toString(): string; toComponent(): React.ReactElement };
    priority: { toString(): string; toComponent(): React.ReactElement };
  }

  export interface HelmetProviderProps {
    context?: {
      helmet?: HelmetServerState;
    };
    children: React.ReactNode;
  }

  export const Helmet: React.FC<HelmetProps>;
  export const HelmetProvider: React.FC<HelmetProviderProps>;
}