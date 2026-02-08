import type { Page } from '@playwright/test';

export interface SeedGroupMember {
    rawWord: string;
    yomigana: string;
    customLabel?: string;
    exampleSentence?: string;
    exampleSentenceYomigana?: string;
}

export interface SeedWord {
    page: number;
    numberInPage: number;
    category: string;
    question: string;
    answer: string;
    rawWord: string;
    yomigana?: string;
    rawMeaning: string;
    exampleSentence?: string;
    exampleSentenceYomigana?: string;
    groupMembers?: SeedGroupMember[];
    isLearnedCategory: boolean;
    isLearnedMeaning: boolean;
}

export interface SeedSchedule {
    scopeId: string;
    date: string;
}

export interface SeedSheetLock {
    maskKey: string;
    wordId: number;
    side: 'left' | 'right';
}

export interface SeedLearningDailyStat {
    scopeId: string;
    date: string;
    unitKey: string;
    side: 'left' | 'right';
    revealCount?: number;
    testCorrectCount?: number;
    testWrongCount?: number;
    testForgotCount?: number;
}

export interface SeedState {
    words?: SeedWord[];
    schedules?: SeedSchedule[];
    sheetLocks?: SeedSheetLock[];
    learningDailyStats?: SeedLearningDailyStat[];
}

export const seedState = async (page: Page, state: SeedState) => {
    await page.goto('/e2e-seed.html');
    await page.evaluate(async (payload: SeedState) => {
        const dbName = 'KotobaNaviDB';
        const openRequest = indexedDB.open(dbName);

        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            openRequest.onupgradeneeded = () => {
                const upgradingDb = openRequest.result;

                if (!upgradingDb.objectStoreNames.contains('words')) {
                    const wordsStore = upgradingDb.createObjectStore('words', { keyPath: 'id', autoIncrement: true });
                    wordsStore.createIndex('page', 'page', { unique: false });
                    wordsStore.createIndex('category', 'category', { unique: false });
                    wordsStore.createIndex('isLearnedCategory', 'isLearnedCategory', { unique: false });
                    wordsStore.createIndex('isLearnedMeaning', 'isLearnedMeaning', { unique: false });
                }

                if (!upgradingDb.objectStoreNames.contains('schedules')) {
                    const schedulesStore = upgradingDb.createObjectStore('schedules', { keyPath: 'id', autoIncrement: true });
                    schedulesStore.createIndex('scopeId', 'scopeId', { unique: false });
                    schedulesStore.createIndex('date', 'date', { unique: false });
                }

                if (!upgradingDb.objectStoreNames.contains('sheetLocks')) {
                    const sheetLocksStore = upgradingDb.createObjectStore('sheetLocks', { keyPath: 'id', autoIncrement: true });
                    sheetLocksStore.createIndex('maskKey', 'maskKey', { unique: true });
                    sheetLocksStore.createIndex('wordId', 'wordId', { unique: false });
                    sheetLocksStore.createIndex('side', 'side', { unique: false });
                    sheetLocksStore.createIndex('[wordId+side]', ['wordId', 'side'], { unique: false });
                }

                if (!upgradingDb.objectStoreNames.contains('learningDailyStats')) {
                    const learningStore = upgradingDb.createObjectStore('learningDailyStats', { keyPath: 'id', autoIncrement: true });
                    learningStore.createIndex('dailyKey', 'dailyKey', { unique: true });
                    learningStore.createIndex('scopeId', 'scopeId', { unique: false });
                    learningStore.createIndex('date', 'date', { unique: false });
                    learningStore.createIndex('unitKey', 'unitKey', { unique: false });
                    learningStore.createIndex('side', 'side', { unique: false });
                    learningStore.createIndex('[scopeId+date]', ['scopeId', 'date'], { unique: false });
                    learningStore.createIndex('[scopeId+unitKey]', ['scopeId', 'unitKey'], { unique: false });
                    learningStore.createIndex('[scopeId+side+date]', ['scopeId', 'side', 'date'], { unique: false });
                }
            };
            openRequest.onsuccess = () => resolve(openRequest.result);
            openRequest.onerror = () => reject(openRequest.error);
        });

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['words', 'schedules', 'sheetLocks', 'learningDailyStats'], 'readwrite');
            const wordsStore = tx.objectStore('words');
            const schedulesStore = tx.objectStore('schedules');
            const sheetLocksStore = tx.objectStore('sheetLocks');
            const learningStore = tx.objectStore('learningDailyStats');

            wordsStore.clear();
            schedulesStore.clear();
            sheetLocksStore.clear();
            learningStore.clear();

            for (const record of payload.words || []) {
                wordsStore.add(record);
            }
            for (const schedule of payload.schedules || []) {
                schedulesStore.add(schedule);
            }
            for (const lock of payload.sheetLocks || []) {
                sheetLocksStore.add(lock);
            }
            for (const stat of payload.learningDailyStats || []) {
                const dailyKey = `${stat.scopeId}|${stat.date}|${stat.unitKey}|${stat.side}`;
                learningStore.add({
                    dailyKey,
                    scopeId: stat.scopeId,
                    date: stat.date,
                    unitKey: stat.unitKey,
                    side: stat.side,
                    revealCount: stat.revealCount || 0,
                    testCorrectCount: stat.testCorrectCount || 0,
                    testWrongCount: stat.testWrongCount || 0,
                    testForgotCount: stat.testForgotCount || 0,
                    updatedAt: new Date().toISOString()
                });
            }

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });

        db.close();
    }, state);
};

export const seedWords = async (page: Page, words: SeedWord[]) => {
    await seedState(page, { words });
};
