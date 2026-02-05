import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';

export class StandardImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // Standard format: Page, Number, Word, Yomigana, Meaning
        // Cannot be certain just by length, but usually Position strategy triggers on specific keywords
        // So this is a fallback or default.
        return row.length >= 5;
    }

    parseRow(row: string[]): ParsedCSVRow | null {
        try {
            const page = parseInt(row[0]);
            const numberInPage = parseInt(row[1]);
            const rawWord = row[2];
            const yomigana = row[3];
            const meaning = row[4];

            if (isNaN(page) || !rawWord || !meaning) return null;

            return {
                page,
                numberInPage,
                rawWord,
                yomigana,
                meaning
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
            4: 'rawMeaning'
        };
    }
}
