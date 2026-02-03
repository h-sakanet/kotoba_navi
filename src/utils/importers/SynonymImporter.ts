import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';

export class SynonymImporter implements ImportStrategy {
    canHandle(row: string[]): boolean {
        // Synonym format: 10 columns
        // Page, Num, WordA, YomiA, SentenceA, YomiSentenceA, WordB, YomiB, SentenceB, YomiSentenceB
        return row.length >= 10 && !isNaN(parseInt(row[0])) && !isNaN(parseInt(row[1]));
    }

    parseRow(row: string[]): ParsedCSVRow | ParsedCSVRow[] | null {
        try {
            const page = parseInt(row[0]);
            const numberInPage = parseInt(row[1]);

            // Item A (Upper/Left)
            const wordA = row[2];
            const yomiA = row[3];
            const sentenceA = row[4];
            const sentenceYomiA = row[5];

            // Item B (Lower/Right)
            const wordB = row[6];
            const yomiB = row[7];
            const sentenceB = row[8];
            const sentenceYomiB = row[9];

            if (!wordA || !wordB) return null;

            const rowA: ParsedCSVRow = {
                page,
                numberInPage,
                rawWord: wordA,
                yomigana: yomiA,
                meaning: sentenceA, // This will be rawMeaning
                exampleSentence: sentenceA,
                exampleSentenceYomigana: sentenceYomiA,
                question: wordA,
                customLabel: '上'
            };

            const rowB: ParsedCSVRow = {
                page,
                numberInPage,
                rawWord: wordB,
                yomigana: yomiB,
                meaning: sentenceB,
                exampleSentence: sentenceB,
                exampleSentenceYomigana: sentenceYomiB,
                question: wordB,
                customLabel: '下'
            };

            return [rowA, rowB];
        } catch {
            return null;
        }
    }
}
