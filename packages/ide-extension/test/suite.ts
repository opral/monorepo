import * as path from 'node:path';
import { run } from 'node:test';

export function runSuite() {
  run({ files: [path.resolve('**/**.test.js')] }).pipe(process.stdout);
}
