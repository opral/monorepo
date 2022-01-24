import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import injectEnvVariables from 'rollup-plugin-inject-process-env';

/**
 * What is rollup used for?
 *
 * Rollup bundles all dependencies into one file i.e.
 * the resulting code has no dependencies on node modules.
 * That avoids problems that can (did) occur when resolving
 * those dependencies.
 */

/**
 * ENV variables based on production / development env.
 *
 * Cool alternative could be https://www.npmjs.com/package/ts-dotenv
 * but reading a local .env file lead to problems.
 */
const env = process.env.ROLLUP_WATCH
  ? // development
    {
      API_ENDPOINT: 'http://localhost:3000/api/',
    }
  : // production
    {
      API_ENDPOINT: 'https://app.inlang.dev/api/',
    };

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [
    // nodeResolve = bundle the dependencies
    nodeResolve(),
    // typescript = compile typescript
    typescript(),
    // commonjs = because of commonjs peer dependencies (peggy.js)
    commonjs(),
    // inject = pass env variables into the compiled code to not
    injectEnvVariables(env),
  ],
};
