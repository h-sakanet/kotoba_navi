
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

            // Detect format based on column count or Pos column
            // Tsuininaru has "上" or "下" in col 2?
            const isTsuininaru = row.length >= 6 && (row[2] === '上' || row[2] === '下');

            if (isTsuininaru) {
                // Page, No, Pos, Proverb, Yomi, Meaning
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

            // Map to internal fields for "Homonym-style" layout:
            // Left Column (yomigana field) <- Meaning
            // Right Column List Item (rawWord) <- Proverb
            // Right Column List Sub (exampleSentence) <- Yomi (Furigana)

            return {
                page,
                numberInPage,
                rawWord: proverb,
                yomigana: meaning, // Storing Meaning in yomigana field to utilize Left Column display
                meaning: meaning, // Keep raw meaning too
                exampleSentence: yomi, // Storing Yomi in exampleSentence to utilize Right Column Sub display
                customLabel: undefined
            };
        } catch {
            return null;
        }
    }
}
