import * as path from 'node:path';
import { run as nodeTestRun } from 'node:test';

export function run() {
  nodeTestRun({ files: [path.resolve('**/**.test.js')] }).pipe(process.stdout);
}
