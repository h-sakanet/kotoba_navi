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
                        const col2 = row[2]; // usually Word/Kotowaza (answer for meaning test)
                        const col3 = row[3]; // usually Meaning (question for meaning test)

                        // Basic validation
                        if (!pageStr || !col2 || !col3) continue;

                        const page = parseInt(pageStr);
                        if (isNaN(page)) continue;

                        affectedPages.add(page);

                        // Determine category... Wait, CSV doesn't have category in the row data usually,
                        // or we might need to infer it from the scope?
                        // The requirement says:
                        // "2. インポートCSVの列構造... カテゴリ「ことわざ」についてはkotowaza.csvの通り。それ以外のカテゴリについてはひとまず未定"
                        // And scope.csv has category mapping by page range.
                        // So we should identify category by page number using SCOPES.
                        // However, for now, we can leave category matching for query time or fill it here if we want to store it.
                        // Storing it is better for performance.
                        // We need to look up SCOPES. Since I can't easily import SCOPES here without circular dep issues if SCOPE imports something... 
                        // actually SCOPES is just data.
                        // I'll import SCOPES dynamically or pass it in? No, just import it.

                        // For now, let's treat "category" as optional or derived?
                        // "data.category" in schema.
                        // We need to find the category for this page.
                        // We'll defer category assignment or do it here.
                        // Let's import SCOPES.

                        newWords.push({
                            page: page,
                            numberInPage: parseInt(numberStr) || 0,
                            category: 'ことわざ', // Default or need lookup
                            question: col3, // Meaning
                            answer: col2,   // Word
                            rawWord: col2,
                            rawMeaning: col3,
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
