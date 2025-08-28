import "@testing-library/jest-dom";
import { Blob as NodeBlob } from "node:buffer";

// Override JSDOM Blob with Node's Blob so arrayBuffer() is available in tests.
// Ref: https://github.com/jsdom/jsdom/issues/2555
globalThis.Blob = NodeBlob as unknown as typeof Blob;
