import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';
import { hasPageAndNumber, isLikelyReading, isLikelySentence } from './rowGuards';

export class HomonymImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // Homonyms format: Page, No, Yomi, Kanji, Sentence, SentenceYomi
        if (row.length < 6 || !hasPageAndNumber(row)) return false;

        const yomi = (row[2] || '').trim();
        const kanji = (row[3] || '').trim();
        const sentence = (row[4] || '').trim();
        const sentenceYomi = (row[5] || '').trim();

        if (!yomi || !kanji || !sentence || !sentenceYomi) return false;
        if (!isLikelyReading(yomi)) return false;
        if (!isLikelySentence(sentence)) return false;
        if (!isLikelyReading(sentenceYomi)) return false;

        return true;
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
