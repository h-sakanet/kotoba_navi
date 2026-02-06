import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';
import { hasPageAndNumber, isLikelyReading, isLikelySentence, isPositionLabel } from './rowGuards';

export class IdiomImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // Idioms format: Page, Number, QuestionSentence, Word, Yomigana, Meaning
        if (row.length < 6 || !hasPageAndNumber(row)) return false;
        if (isPositionLabel((row[2] || '').trim())) return false;

        const sentence = (row[2] || '').trim();
        const word = (row[3] || '').trim();
        const yomigana = (row[4] || '').trim();
        const meaning = (row[5] || '').trim();

        if (!sentence || !word || !yomigana || !meaning) return false;
        if (!isLikelySentence(sentence)) return false;
        if (!isLikelyReading(yomigana)) return false;

        return true;
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
        } catch {
            return null;
        }
    }
    getColumnMapping(): Record<number, string> {
        return {
            0: 'page',
            1: 'number',
            2: 'exampleSentence',
            3: 'rawWord',
            4: 'yomigana',
            5: 'rawMeaning'
        };
    }
}
