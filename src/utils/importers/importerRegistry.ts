import type { Category } from '../../types';
import { CATEGORY_SETTINGS, type ImporterKind } from '../categoryConfig';
import { HomonymImporter } from './HomonymImporter';
import { IdiomImporter } from './IdiomImporter';
import type { ImportStrategy } from './ImportStrategy';
import { PairedIdiomImporter } from './PairedIdiomImporter';
import { PairedProverbImporter } from './PairedProverbImporter';
import { PositionImporter } from './PositionImporter';
import { SimilarProverbImporter } from './SimilarProverbImporter';
import { StandardImporter } from './StandardImporter';
import { SynonymImporter } from './SynonymImporter';

const IMPORTER_BY_KIND: Record<ImporterKind, ImportStrategy> = {
    standard: new StandardImporter(),
    idiom: new IdiomImporter(),
    synonym: new SynonymImporter(),
    homonym: new HomonymImporter(),
    similar_proverb: new SimilarProverbImporter(),
    paired_proverb: new PairedProverbImporter(),
    paired_idiom: new PairedIdiomImporter()
};

const FALLBACK_IMPORTERS: ImportStrategy[] = [
    new PositionImporter(),
    IMPORTER_BY_KIND.synonym,
    IMPORTER_BY_KIND.paired_idiom,
    IMPORTER_BY_KIND.homonym,
    IMPORTER_BY_KIND.similar_proverb,
    IMPORTER_BY_KIND.paired_proverb,
    IMPORTER_BY_KIND.idiom,
    IMPORTER_BY_KIND.standard
];

export const getImporterForCategory = (category: Category): ImportStrategy => {
    const kind = CATEGORY_SETTINGS[category].importerKind;
    return IMPORTER_BY_KIND[kind];
};

export const getFallbackImporters = (): ImportStrategy[] => FALLBACK_IMPORTERS;

export const getRegisteredImporterKinds = (): ImporterKind[] =>
    Object.keys(IMPORTER_BY_KIND) as ImporterKind[];
