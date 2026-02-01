import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';

export class IdiomImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // Idioms format: Page, Number, QuestionSentence, Word, Yomigana, Meaning (6 columns)
        // PositionImporter also has 6 columns but Col 2 is '上'/'下'.
        // So we check for length 6 AND NOT '上'/'下' at index 2.
        return row.length >= 6 && row[2] !== '上' && row[2] !== '下';
    }

    parseRow(row: string[]): ParsedCSVRow | null {
        try {
            const page = parseInt(row[0]);
            const numberInPage = parseInt(row[1]);
            const exampleSentence = row[2];
            const rawWord = row[3];
            const yomigana = row[4];
            const meaning = row[5];

            if (isNaN(page) || !rawWord || !meaning) return null;

            return {
                page,
                numberInPage,
                rawWord,
                yomigana,
                meaning,
                exampleSentence: exampleSentence || undefined
            };
        } catch (e) {
            return null;
        }
    }
}
