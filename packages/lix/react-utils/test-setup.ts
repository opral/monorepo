import { Blob as BlobPolyfill } from "node:buffer";

// https://github.com/jsdom/jsdom/issues/2555#issuecomment-1864762292
global.Blob = BlobPolyfill as any;
