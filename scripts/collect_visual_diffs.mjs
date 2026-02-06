import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_RESULTS_DIR = 'test-results';
const DEFAULT_OUTPUT_ROOT = '.artifacts/visual-diff';

const isDiffPng = (filename) => filename === 'diff.png' || filename.endsWith('-diff.png');

const walkFiles = (dir) => {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkFiles(fullPath));
            continue;
        }
        files.push(fullPath);
    }
    return files;
};

const findDiffDirectories = (resultsDir) => {
    const files = walkFiles(resultsDir);
    const dirs = new Set();
    for (const filePath of files) {
        if (isDiffPng(path.basename(filePath))) {
            dirs.add(path.dirname(filePath));
        }
    }
    return [...dirs];
};

const timestamp = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
};

const copyPngArtifacts = (diffDirs, resultsDir, outputRoot) => {
    if (diffDirs.length === 0) return null;

    const runDir = path.join(outputRoot, timestamp());
    fs.mkdirSync(runDir, { recursive: true });

    const copiedFiles = [];

    for (const dir of diffDirs) {
        const pngFiles = fs.readdirSync(dir)
            .filter((name) => name.endsWith('.png'))
            .map((name) => path.join(dir, name));

        for (const src of pngFiles) {
            const rel = path.relative(resultsDir, src);
            const dest = path.join(runDir, rel);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
            copiedFiles.push(dest);
        }
    }

    const summary = {
        generatedAt: new Date().toISOString(),
        resultsDir,
        diffDirectoryCount: diffDirs.length,
        copiedFileCount: copiedFiles.length,
        copiedFiles: copiedFiles.map((p) => path.relative(process.cwd(), p))
    };
    fs.writeFileSync(path.join(runDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

    return { runDir, summary };
};

export const collectVisualDiffs = ({
    resultsDir = DEFAULT_RESULTS_DIR,
    outputRoot = DEFAULT_OUTPUT_ROOT
} = {}) => {
    const absoluteResultsDir = path.resolve(process.cwd(), resultsDir);
    const absoluteOutputRoot = path.resolve(process.cwd(), outputRoot);

    if (!fs.existsSync(absoluteResultsDir)) {
        return {
            hasDiff: false,
            message: `No test results directory: ${resultsDir}`
        };
    }

    const diffDirs = findDiffDirectories(absoluteResultsDir);
    const copied = copyPngArtifacts(diffDirs, absoluteResultsDir, absoluteOutputRoot);

    if (!copied) {
        return {
            hasDiff: false,
            message: 'No visual diff images found.'
        };
    }

    return {
        hasDiff: true,
        message: `Visual diffs exported to ${path.relative(process.cwd(), copied.runDir)}`,
        runDir: copied.runDir,
        summary: copied.summary
    };
};

if (import.meta.url === `file://${process.argv[1]}`) {
    const result = collectVisualDiffs();
    if (result.hasDiff) {
        console.log(result.message);
        console.log(`Diff directories: ${result.summary.diffDirectoryCount}`);
        console.log(`Copied files: ${result.summary.copiedFileCount}`);
        process.exit(0);
    }
    console.log(result.message);
    process.exit(0);
}

