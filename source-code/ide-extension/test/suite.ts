import { startVitest } from 'vitest/node'

startVitest('test', [], { run: true }).then((vitest) => vitest?.close())
