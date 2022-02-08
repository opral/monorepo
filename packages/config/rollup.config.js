import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

/**
 * What is rollup used for?
 *
 * Bundling the schemas (JSONS) directly in JS to avoid the necessity
 * to dynamically import the JSON files which leads to problems (some enviroments
 * don't support it for example.).
 */

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [
    // typescript = compile typescript
    typescript(),
    // json = bundle the json schemas directly in the js code
    json(),
    // nodeResolve = bundle the dependencies
    nodeResolve(),
    // commonjs = because of commonjs peer dependencies (ajv)
    commonjs(),
  ],
};
