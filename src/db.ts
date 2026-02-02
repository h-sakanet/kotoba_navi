import Dexie, { type EntityTable } from 'dexie';
import { type Word } from './types';

const db = new Dexie('KotobaNaviDB') as Dexie & {
    words: EntityTable<
        Word,
        'id' // primary key "id" (for the typings only)
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


export { db };
