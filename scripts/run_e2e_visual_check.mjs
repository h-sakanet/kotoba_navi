import { spawn } from 'node:child_process';
import { collectVisualDiffs } from './collect_visual_diffs.mjs';

const passthroughArgs = process.argv.slice(2);
const args = [
    'playwright',
    'test',
    '--reporter=list',
    ...passthroughArgs
];

const child = spawn('npx', args, {
    stdio: 'inherit',
    env: process.env
});

child.on('close', (code) => {
    const result = collectVisualDiffs();
    if (result.hasDiff) {
        console.log(result.message);
    } else {
        console.log(result.message);
    }
    process.exit(code ?? 1);
});
