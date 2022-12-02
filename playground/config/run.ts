import { execSync } from 'child_process'

const example = process.argv[2]
execSync(`ts-node ./playground/${example}`, { stdio: 'inherit' })
