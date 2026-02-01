
import { type ImportStrategy, type ParsedCSVRow } from './ImportStrategy';

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
        // Needs to differentiate from IdiomImporter which also thinks it handles 6 columns.
        // IdiomImporter expects Col 2 to be Sentence (long?).
        // In Tsuijukugo, Col 2 is Word (short, 2 chars usu).
        // But rely on strict check? 
        // Or maybe IdiomImporter check is: row[2] !== '上' ... 
        // Only way to distinguish is context or maybe content.
        // But wait, `IdiomImporter` says: `Idioms format: Page, Number, QuestionSentence, Word, Yomigana, Meaning`
        // If I use `PairedIdiomImporter`, I must place it BEFORE `IdiomImporter` in the list, 
        // AND ensure `IdiomImporter` doesn't grab it, OR make this one specific.
        // Actually, if I look at `IdiomImporter`, it checks `row.length >= 6`.
        // Let's check `tsuijukugo` Page IDs? 
        // Page 101-102.
        // I can add a page range check or Category check if I knew it. But Importer is generic.
        // Let's assume `tsuijukugo` has specific logic or just create a heuristic.
        // Word (Col 2) is usually short (Length <= 4?). Sentence (Col 4) is long.
        // In IdiomImporter: Col 2 is Sentence (Long). Col 3 is Word.
        // So:
        // If Col 2 is short (Word) AND Col 4 is long (Sentence) -> PairedIdiomImporter.
        // If Col 2 is long (Sentence) -> IdiomImporter.

        if (row.length < 6) return false;

        const col2 = row[2]; // Word candidate
        const col4 = row[4]; // Sentence candidate

        // Simple heuristic: Word is usually shorter than Sentence.
        // And Word usually has no punctuation, Sentence does.
        return col2.length < col4.length;
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
                // For this category, Question -> Sentence, Answer -> Word.
                // Standard logic in csvImporter uses `question: parsed.question || parsed.meaning`.
                // If I set `question` explicitly, it uses it.
                // If I leave `question` undefined, it uses meaning.
                // Let's set `question` to exampleSentence (or meaning field to it).
                // Actually, `csvImporter` sets: `question: parsed.question || parsed.meaning`.
                // And `answer: parsed.rawWord`.
                // So if I set `meaning: exampleSentence`, then Question = Sentence.
                meaning: exampleSentence,
                question: exampleSentence,
                exampleSentence,
                exampleSentenceYomigana
            };
        } catch (e) {
            return null;
        }
    }
}
