import { type Category } from '../types';

export const HOMONYM_CATEGORIES = new Set<Category>([
    '同音異義語',
    '同訓異字',
    '似た意味のことわざ',
    '対になることわざ'
]);

export const PROVERB_GROUP_CATEGORIES = new Set<Category>([
    '似た意味のことわざ',
    '対になることわざ'
]);

export const SYNONYM_CATEGORIES = new Set<Category>([
    '類義語',
    '対義語'
]);

export const IDIOM_CATEGORIES = new Set<Category>([
    '慣用句',
    '四字熟語',
    '三字熟語'
]);

export const SINGLE_TEST_CATEGORIES = new Set<Category>([
    '類義語',
    '対義語',
    '上下で対となる熟語',
    '同音異義語',
    '同訓異字',
    '似た意味のことわざ',
    '対になることわざ'
]);

export const EXAMPLE_SENTENCE_EDIT_CATEGORIES = new Set<Category>([
    '類義語',
    '対義語',
    '慣用句',
    '四字熟語',
    '三字熟語'
]);

export const isHomonymCategory = (category: Category): boolean =>
    HOMONYM_CATEGORIES.has(category);

export const isProverbGroupCategory = (category: Category): boolean =>
    PROVERB_GROUP_CATEGORIES.has(category);

export const isSynonymCategory = (category: Category): boolean =>
    SYNONYM_CATEGORIES.has(category);

export const isIdiomCategory = (category: Category): boolean =>
    IDIOM_CATEGORIES.has(category);

export const isSingleTestCategory = (category: Category): boolean =>
    SINGLE_TEST_CATEGORIES.has(category);

export const hasMeaningTest = (category: Category): boolean =>
    !SINGLE_TEST_CATEGORIES.has(category);

export const canEditExampleSentence = (category: Category): boolean =>
    EXAMPLE_SENTENCE_EDIT_CATEGORIES.has(category);
