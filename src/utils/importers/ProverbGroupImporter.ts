
import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';

export class ProverbGroupImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // This importer is strictly triggered by Page/Category logic in csvImporter.ts
        // But for safety:
        // Niteiru: Page, No, Proverb, Yomi, Meaning (5 cols)
        // Tsuininaru: Page, No, Pos, Proverb, Yomi, Meaning (6 cols)
        return row.length >= 5;
    }

    parseRow(row: string[]): ParsedCSVRow | null {
        try {
            const page = parseInt(row[0]);
            const numberInPage = parseInt(row[1]);

            if (isNaN(page)) return null;

            let proverb = '';
            let yomi = '';
            let meaning = '';
            let position: string | undefined;

            // Detect format based on column count or Pos column
            // Tsuininaru has "上" or "下" in col 2
            const isTsuininaru = row.length >= 6 && (row[2] === '上' || row[2] === '下');

            if (isTsuininaru) {
                // Page, No, Pos, Proverb, Yomi, Meaning
                position = row[2];
                proverb = row[3];
                yomi = row[4];
                meaning = row[5];
            } else {
                // Page, No, Proverb, Yomi, Meaning
                // Niteiru format
                proverb = row[2];
                yomi = row[3];
                meaning = row[4];
            }

            if (!proverb || !meaning) return null;

            return {
                page,
                numberInPage,
                rawWord: proverb,
                yomigana: yomi,
                meaning,
                customLabel: position
            };
        } catch {
            return null;
        }
    }
    getColumnMapping(): Record<number, string> {
        // Note: This covers both Niteiru (5 cols) and Tsuininaru (6 cols)
        // If 6 cols, index 2 is Position.
        return {
            0: 'page',
            1: 'number',
            2: 'rawWord_or_position', // Variable
            3: 'yomigana_or_rawWord',
            4: 'rawMeaning_or_yomigana',
            5: 'rawMeaning_if_paired'
        };
    }
}
