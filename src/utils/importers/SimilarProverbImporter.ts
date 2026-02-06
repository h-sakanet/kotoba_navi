import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';
import { hasPageAndNumber } from './rowGuards';

export class SimilarProverbImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // Strictly 5 columns: Page, Number, Word, Yomi, Meaning
        return row.length === 5 && hasPageAndNumber(row);
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
                meaning,
                // No customLabel for Similar proverbs
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
