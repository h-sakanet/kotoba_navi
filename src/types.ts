export type Category = 'ことわざ' | '慣用句' | '類義語' | '対義語' | '四字熟語' | '三字熟語' | '同音異義語' | '同訓異字' | '似た意味のことわざ' | '対になることわざ' | '上下で対となる熟語';

export interface Scope {
    id: string; // e.g. "42A-02"
    displayId?: string; // Optional override for display (e.g. if multiple scopes share the same visible ID)
    startPage: number;
    endPage: number;
    category: Category;
}

export interface GroupMember {
    rawWord: string;
    yomigana: string;
    customLabel?: string;
    exampleSentence?: string;
    exampleSentenceYomigana?: string;
}

export interface Schedule {
    scopeId: string;
    date: string; // ISO-8601 YYYY-MM-DD
}

export interface Word {
    id?: number; // Auto-incremented ID by Dexie
    page: number;
    numberInPage: number; // The "番号" column in CSV
    category: Category;
    question: string; // usually the "Meaning" or "Reading" depending on test type
    answer: string;   // usually the "Word" or "Writing"

    // Metadata for different test types
    // For 'ことわざ', question is 意味, answer is ことわざ.
    // For '対義語', question is word, answer is opposite word.
    // We will store raw values from CSV for flexibility
    rawWord: string;    // Column 2
    yomigana?: string;  // Column 3
    rawMeaning: string; // Column 4
    exampleSentence?: string;
    exampleSentenceYomigana?: string;

    // For categories with multiple answers (e.g. 似た意味のことわざ)
    groupMembers?: GroupMember[];

    isLearnedCategory: boolean; // Learned in Category Test (Meaning -> Word)
    isLearnedMeaning: boolean;  // Learned in Meaning Test (Word -> Meaning)
    lastStudied?: Date;
}

export type TestType = 'category' | 'meaning' | 'final';
