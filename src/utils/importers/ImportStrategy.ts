export interface ParsedCSVRow {
    page: number;
    numberInPage: number;
    rawWord: string;
    yomigana: string;
    meaning: string;
    customLabel?: string;
    exampleSentence?: string;
    exampleSentenceYomigana?: string;
    question?: string; // Optional override for default question
}

export interface ImportStrategy {
    canHandle(row: string[]): boolean;
    parseRow(row: string[]): ParsedCSVRow | ParsedCSVRow[] | null;
    getColumnMapping(): Record<number, string>;
}
