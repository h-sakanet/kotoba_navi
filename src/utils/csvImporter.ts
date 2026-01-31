import Papa from 'papaparse';
import { db } from '../db';
import { type Word, type Category } from '../types';

export const parseAndImportCSV = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: false, // We expect no header or we handle columns by index
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const data = results.data as string[][];
                    if (data.length === 0) {
                        return resolve();
                    }

                    // Validation: Check if first column is likely a page number (numeric)
                    // We'll skip the header row if it exists (numeric check fails for "ページ番号")
                    let startIndex = 0;
                    if (isNaN(parseInt(data[0][0]))) {
                        startIndex = 1;
                    }

                    const newWords: Word[] = [];
                    const affectedPages = new Set<number>();

                    for (let i = startIndex; i < data.length; i++) {
                        const row = data[i];
                        const pageStr = row[0];
                        const numberStr = row[1]; // 番号
                        const col2 = row[2]; // Kotowaza
                        const col3 = row[3]; // Yomigana
                        const col4 = row[4]; // Meaning

                        // Basic validation: Need at least page, number, kotowaza, meaning. Yomigana might be optional?
                        // User said "Added yomigana", assuming it's there.
                        if (!pageStr || !col2 || !col4) continue;

                        const page = parseInt(pageStr);
                        if (isNaN(page)) continue;

                        affectedPages.add(page);

                        newWords.push({
                            page: page,
                            numberInPage: parseInt(numberStr) || 0,
                            category: 'ことわざ', // Default, will be updated
                            question: col4, // Meaning
                            answer: col2,   // Word/Kotowaza
                            rawWord: col2,
                            yomigana: col3,
                            rawMeaning: col4,
                            isLearnedCategory: false,
                            isLearnedMeaning: false,
                        });
                    }

                    // Now we need to look up categories. 
                    // Since I didn't import SCOPES yet, let's import it.
                    // Note: If a page belongs to multiple scopes (unlikely for same page numbers), we take firstmatch.
                    const { SCOPES } = await import('../data/scope.ts');

                    const finalWords = newWords.map(w => {
                        const scope = SCOPES.find(s => w.page >= s.startPage && w.page <= s.endPage);
                        return {
                            ...w,
                            category: scope ? scope.category : ('その他' as Category)
                        };
                    });

                    await db.transaction('rw', db.words, async () => {
                        // Delete existing data for affected pages
                        for (const page of affectedPages) {
                            await db.words.where('page').equals(page).delete();
                        }
                        // Bulk add
                        await db.words.bulkAdd(finalWords);
                    });

                    resolve();
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};
