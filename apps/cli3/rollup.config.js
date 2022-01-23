import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

/**
 * What is rollup used for?
 *
 * Rollup bundles all dependencies into one file i.e.
 * the resulting code has no dependencies on node modules.
 * That avoids problems that can (did) occur when resolving
 * those dependencies.
 */

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'es',
  },
  // nodeResolve = bundle the dependencies
  // typescript = compile typescript
  // commonjs = because of commonjs peer dependencies
  plugins: [nodeResolve(), typescript(), commonjs()],
};
