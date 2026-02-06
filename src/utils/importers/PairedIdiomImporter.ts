
import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';
import { hasPageAndNumber, isLikelyReading, isLikelySentence, isLikelyWord, isPositionLabel } from './rowGuards';

export class PairedIdiomImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // Paired Idioms format:
        // Col 0: Page
        // Col 1: No
        // Col 2: Word (熟語)
        // Col 3: Yomi (熟語よみがな)
        // Col 4: Sentence (出題文)
        // Col 5: SentenceYomi (出題文よみがな)
        // Total 6 columns.
        if (row.length < 6 || !hasPageAndNumber(row)) return false;

        // PositionImporter handles rows with '上'/'下' in col 2.
        if (isPositionLabel((row[2] || '').trim())) return false;

        const word = (row[2] || '').trim();
        const yomigana = (row[3] || '').trim();
        const sentence = (row[4] || '').trim();
        const sentenceYomigana = (row[5] || '').trim();

        if (!word || !yomigana || !sentence || !sentenceYomigana) return false;
        if (!isLikelyWord(word)) return false;
        if (!isLikelyReading(yomigana)) return false;
        if (!isLikelySentence(sentence)) return false;
        if (!isLikelyReading(sentenceYomigana)) return false;

        return true;
    }

    parseRow(row: string[]): ParsedCSVRow | null {
        try {
            const page = parseInt(row[0]);
            const numberInPage = parseInt(row[1]);
            const rawWord = row[2];
            const yomigana = row[3];
            const exampleSentence = row[4];
            const exampleSentenceYomigana = row[5];

            if (isNaN(page) || !rawWord || !exampleSentence) return null;

            return {
                page,
                numberInPage,
                rawWord,
                yomigana,
                meaning: '', // Not used for Paired Idioms
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
            2: 'rawWord',
            3: 'yomigana',
            4: 'exampleSentence',
            5: 'exampleSentenceYomigana'
        };
    }
}
