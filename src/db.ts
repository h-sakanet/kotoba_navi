import Dexie, { type EntityTable } from 'dexie';
import { type Word } from './types';

const db = new Dexie('KotobaNaviDB') as Dexie & {
    words: EntityTable<
        Word,
        'id' // primary key "id" (for the typings only)
    >;
    schedules: EntityTable<
        { id?: number; scopeId: string; date: string },
        'id'
    >;
    sheetLocks: EntityTable<
        { id?: number; maskKey: string; wordId: number; side: 'left' | 'right' },
        'id'
    >;
    learningDailyStats: EntityTable<
        {
            id?: number;
            dailyKey: string;
            scopeId: string;
            date: string;
            unitKey: string;
            side: 'left' | 'right';
            revealCount: number;
            testCorrectCount: number;
            testWrongCount: number;
            testForgotCount: number;
            updatedAt: string;
        },
        'id'
    >;
};

// Version 1
db.version(1).stores({
    words: '++id, page, category, isLearned'
});

// Version 2: Split isLearned into isLearnedCategory and isLearnedMeaning
db.version(2).stores({
    words: '++id, page, category, isLearnedCategory, isLearnedMeaning'
}).upgrade(tx => {
    // Migrate existing data
    // We need to iterate all words. Dexie upgrade callback doesn't support EntityTable types directly easily without casting
    // accessing underlying table.
    return tx.table('words').toCollection().modify(word => {
        // Map old isLearned to both new flags
        word.isLearnedCategory = word.isLearned;
        word.isLearnedMeaning = word.isLearned;
        delete word.isLearned;
    });
});

// Version 3: Add schedules table
db.version(3).stores({
    schedules: '++id, scopeId, date'
});

// Version 4: Add sheet lock persistence
db.version(4).stores({
    schedules: '++id, scopeId, date',
    sheetLocks: '++id, &maskKey, wordId, side, [wordId+side]'
});

// Version 5: Add learning daily stats
db.version(5).stores({
    schedules: '++id, scopeId, date',
    sheetLocks: '++id, &maskKey, wordId, side, [wordId+side]',
    learningDailyStats: '++id, &dailyKey, scopeId, date, unitKey, side, [scopeId+date], [scopeId+unitKey], [scopeId+side+date]'
});


export { db };
