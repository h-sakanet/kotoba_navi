import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';

export class HomonymImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // Homonyms format: Page, No, Yomi, Kanji, Sentence, SentenceYomi (6 cols)
        // IdiomImporter also has 6 cols: Page, No, Sentence, Word, Yomi, Meaning
        // How to distinguish?
        // Idiom: Col 2 (index 2) is Sentence (Long string)
        // Homonym: Col 2 (index 2) is Yomi (Short, Katakana usually)
        // Idiom: Col 4 (index 4) is Yomi.
        // Homonym: Col 3 (index 3) is Kanji.

        // Use Scopes? No, importer strategy usually stateless.
        // Detect "Sentence-like" content?
        // Idiom row[2] "今日会ったばかり..." (Contains Kanji/Hiragana, long)
        // Homonym row[2] "イイン" (Katakana/Hiragana, short)

        // Also Homonym row[5] is "Sentence Yomi" (Long).
        // Idiom row[5] is "Meaning" (Long).

        // Best bet: Check if row[2] is likely Yomi (Short < 10 chars?).
        // And check if row[4] is Sentence (Long).

        // Relaxed Check:
        // Page, No, Yomi, Kanji, Sentence, SentenceYomi
        if (row.length < 5) return false;

        const col2 = row[2] ? row[2].trim() : '';
        const col4 = row[4] ? row[4].trim() : '';

        // Homonym: Col 2 is Yomi (Short). Col 4 is Sentence (Long or matches pattern).
        // Idiom: Col 2 is Sentence (Long).

        // If col2 is short (<= 6 chars) and col4 exists, assume Homonym.
        if (col2.length <= 8 && col4.length > 0) {
            return true;
        }

        return false;
    }

    parseRow(row: string[]): ParsedCSVRow | null {
        try {
            const page = parseInt(row[0]);
            const numberInPage = parseInt(row[1]);
            const yomigana = row[2];
            const rawWord = row[3]; // Kanji
            const exampleSentence = row[4];
            const exampleSentenceYomigana = row[5];

            if (isNaN(page) || !rawWord || !yomigana) return null;

            return {
                page,
                numberInPage,
                rawWord, // Kanji
                yomigana, // Yomi
                meaning: '', // Not used for Homonyms
                exampleSentence,
                exampleSentenceYomigana
            };
        } catch {
            return null;
        }
    }
    getColumnMapping(): Record<number, string> {
        return {
            0: 'page',
            1: 'number',
            2: 'yomigana',
            3: 'rawWord',
            4: 'exampleSentence',
            5: 'exampleSentenceYomigana'
        };
    }
}
