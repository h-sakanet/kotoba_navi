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

export const seedWords = async (page: Page, words: SeedWord[]) => {
    await page.goto('/e2e-seed.html');
    await page.evaluate(async (records: SeedWord[]) => {
        const dbName = 'KotobaNaviDB';
        const openRequest = indexedDB.open(dbName, 3);

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
            };
            openRequest.onsuccess = () => resolve(openRequest.result);
            openRequest.onerror = () => reject(openRequest.error);
        });

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['words', 'schedules'], 'readwrite');
            const wordsStore = tx.objectStore('words');
            const schedulesStore = tx.objectStore('schedules');

            wordsStore.clear();
            schedulesStore.clear();
            for (const record of records) {
                wordsStore.add(record);
            }

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });

        db.close();
    }, words);
};

