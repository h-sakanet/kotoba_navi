import { describe, expect, it } from 'vitest';
import { SCOPES } from '../data/scope';
import { CATEGORY_SETTINGS } from './categoryConfig';
import { getRegisteredImporterKinds } from './importers/importerRegistry';

describe('Category consistency', () => {
    it('all scope categories are defined in category settings', () => {
        for (const scope of SCOPES) {
            expect(CATEGORY_SETTINGS[scope.category]).toBeDefined();
        }
    });

    it('all importer kinds used by category settings are registered', () => {
        const registeredKinds = new Set(getRegisteredImporterKinds());
        for (const [category, settings] of Object.entries(CATEGORY_SETTINGS)) {
            expect(registeredKinds.has(settings.importerKind), `${category} has unknown importer kind: ${settings.importerKind}`).toBe(true);
        }
    });
});
