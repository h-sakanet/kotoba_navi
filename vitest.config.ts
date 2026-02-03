import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary'],
            reportsDirectory: './coverage',
            exclude: [
                'dist/**',
                'node_modules/**',
                'src/test/**',
                '**/*.d.ts',
                'src/types.ts',
                'src/utils/importers/ImportStrategy.ts',
            ],
        },
    },
});
