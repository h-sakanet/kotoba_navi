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

// --- Display Configuration ---

export interface CategoryDisplayConfig {
    headerLeft: string;
    headerRight: string;
    /**
     * Determines if the Left Column (Question side) should display the example sentence.
     * True for Idioms (Kanyouku, 4-char, 3-char) and Synonyms (via custom logic).
     */
    showLeftSentence: boolean;
    /**
     * Determines if the Right Column (Answer side) serves as a "Sentence" column
     * rather than a "Meaning" column. (e.g. Paired Idioms)
     */
    isRightColumnSentence: boolean;
}

export const getCategoryDisplayConfig = (category: Category): CategoryDisplayConfig => {
    // 1. Synonym / Antonym
    if (isSynonymCategory(category)) {
        return {
            headerLeft: category === '類義語' ? '類義語左' : '対義語左',
            headerRight: category === '類義語' ? '類義語右' : '対義語右',
            showLeftSentence: true, // Synonyms allow editing sentence on left
            isRightColumnSentence: false // Synonyms use special rendering
        };
    }

    // 2. Proverb Groups (Similar/Paired Proverbs)
    if (isProverbGroupCategory(category)) {
        return {
            headerLeft: '意味',
            headerRight: 'ことわざ',
            showLeftSentence: false,
            isRightColumnSentence: false // Right is 'Word' (Proverb), not Sentence
        };
    }

    // 3. Homonyms
    if (isHomonymCategory(category)) {
        return {
            headerLeft: 'よみがな',
            headerRight: category, // '同音異義語' or '同訓異字'
            showLeftSentence: false, // Homonym Left is only Yomigana
            isRightColumnSentence: false // Right is Group Members List
        };
    }

    // 4. Paired Idioms (Jukugo)
    if (category === '上下で対となる熟語') {
        return {
            headerLeft: '熟語',
            headerRight: '例文',
            showLeftSentence: false,
            isRightColumnSentence: true // Right column SHOWS the sentence
        };
    }

    // 5. Standard Categories (Idioms, Single Proverbs, others)
    // - Idioms (Kanyouku, 3/4 chars): Header=CategoryName, Right=Meaning, Left=Word+Sentence
    // - Proverbs (Single): Header=CategoryName, Right=Meaning, Left=Word (No Sentence)
    const isIdiom = isIdiomCategory(category);
    return {
        headerLeft: category,
        headerRight: '意味',
        showLeftSentence: isIdiom, // Only Idioms show sentence on left
        isRightColumnSentence: false
    };
};
