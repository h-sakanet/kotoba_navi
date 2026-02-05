import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';

export class PositionImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // Check if column 2 is '上' or '下' (Position column)
        return row.length >= 6 && (row[2] === '上' || row[2] === '下');
    }

    parseRow(row: string[]): ParsedCSVRow | null {
        try {
            const page = parseInt(row[0]);
            const numberInPage = parseInt(row[1]);
            const position = row[2];
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
                customLabel: position
            };
        } catch {
            return null;
        }
    }
    getColumnMapping(): Record<number, string> {
        return {
            0: 'page',
            1: 'number',
            2: 'position',
            3: 'rawWord',
            4: 'yomigana',
            5: 'rawMeaning'
        };
    }
}
