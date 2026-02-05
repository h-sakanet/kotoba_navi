import Papa from 'papaparse';
import { db } from '../db';
import { type Word, type Category, type GroupMember } from '../types';
import { type ImportStrategy } from './importers/ImportStrategy';

interface TempWord extends Word {
    tempLabel?: string;
}
import { StandardImporter } from './importers/StandardImporter';
import { PositionImporter } from './importers/PositionImporter';
import { IdiomImporter } from './importers/IdiomImporter';
import { SynonymImporter } from './importers/SynonymImporter';
import { PairedIdiomImporter } from './importers/PairedIdiomImporter';
import { SimilarProverbImporter } from './importers/SimilarProverbImporter';
import { PairedProverbImporter } from './importers/PairedProverbImporter';
import { HomonymImporter } from './importers/HomonymImporter';

export interface ImportResult {
    category: string;
    count: number;
    mapping: string;
}

export const parseAndImportCSV = (file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const data = results.data as string[][];
                    if (data.length === 0) {
                        return resolve({ category: 'Unknown', count: 0, mapping: '' });
                    }

                    // User guarantees header in row 0
                    const headers = data[0];
                    let startIndex = 0;
                    if (isNaN(parseInt(data[0][0]))) {
                        startIndex = 1;
                    } else {
                        startIndex = 1;
                    }

                    // Import SCOPES dynamically
                    const { SCOPES } = await import('../data/scope.ts');

                    const newWords: Word[] = [];
                    const affectedPages = new Set<number>();

                    const strategies: ImportStrategy[] = [
                        new PositionImporter(),
                        new SynonymImporter(),
                        new PairedIdiomImporter(),
                        new HomonymImporter(),
                        new SimilarProverbImporter(),
                        new PairedProverbImporter(),
                        new IdiomImporter(),
                        new StandardImporter()
                    ];

                    let detectedCategory = '';
                    let activeStrategy: ImportStrategy | undefined;

                    for (let i = startIndex; i < data.length; i++) {
                        const row = data[i];
                        const page = parseInt(row[0]);
                        let strategy: ImportStrategy | undefined;

                        if (!isNaN(page)) {
                            const scope = SCOPES.find(s => page >= s.startPage && page <= s.endPage);
                            if (scope) {
                                if (!detectedCategory) detectedCategory = scope.category;
                                switch (scope.category) {
                                    case '同音異義語':
                                    case '同訓異字':
                                        strategy = strategies.find(s => s instanceof HomonymImporter);
                                        break;
                                    case '似た意味のことわざ':
                                        strategy = strategies.find(s => s instanceof SimilarProverbImporter);
                                        break;
                                    case '対になることわざ':
                                        strategy = strategies.find(s => s instanceof PairedProverbImporter);
                                        break;
                                    case '類義語':
                                    case '対義語':
                                        strategy = strategies.find(s => s instanceof SynonymImporter);
                                        break;
                                    case '上下で対となる熟語':
                                        strategy = strategies.find(s => s instanceof PairedIdiomImporter);
                                        break;
                                    case '慣用句':
                                    case '四字熟語':
                                    case '三字熟語':
                                        strategy = strategies.find(s => s instanceof IdiomImporter);
                                        break;
                                    case 'ことわざ':
                                        strategy = strategies.find(s => s instanceof StandardImporter);
                                        break;
                                }
                            }
                        }

                        if (!strategy || !strategy.canHandle(row)) {
                            strategy = strategies.find(s => s.canHandle(row));
                        }

                        if (!strategy) continue;
                        if (!activeStrategy) activeStrategy = strategy;

                        const parsedResult = strategy.parseRow(row);
                        if (!parsedResult) continue;

                        const parsedRows = Array.isArray(parsedResult) ? parsedResult : [parsedResult];

                        for (const parsed of parsedRows) {
                            affectedPages.add(parsed.page);

                            const existingIndex = newWords.findIndex(w => w.page === parsed.page && w.numberInPage === parsed.numberInPage);

                            if (existingIndex !== -1) {
                                const existing = newWords[existingIndex];
                                const newMember: GroupMember = { rawWord: parsed.rawWord, yomigana: parsed.yomigana };
                                if (parsed.customLabel) newMember.customLabel = parsed.customLabel;
                                if (parsed.exampleSentence) newMember.exampleSentence = parsed.exampleSentence;
                                if (parsed.exampleSentenceYomigana) newMember.exampleSentenceYomigana = parsed.exampleSentenceYomigana;

                                if (!existing.groupMembers) {
                                    const firstMember: GroupMember = { rawWord: existing.rawWord, yomigana: existing.yomigana || '' };
                                    if ((existing as TempWord).tempLabel) firstMember.customLabel = (existing as TempWord).tempLabel;
                                    if (existing.exampleSentence) firstMember.exampleSentence = existing.exampleSentence;
                                    if (existing.exampleSentenceYomigana) firstMember.exampleSentenceYomigana = existing.exampleSentenceYomigana;
                                    existing.groupMembers = [firstMember, newMember];
                                } else {
                                    existing.groupMembers.push(newMember);
                                }
                            } else {
                                const newEntry: TempWord = {
                                    page: parsed.page,
                                    numberInPage: parsed.numberInPage,
                                    category: 'ことわざ',
                                    question: parsed.question || parsed.meaning,
                                    answer: parsed.rawWord,
                                    rawWord: parsed.rawWord,
                                    yomigana: parsed.yomigana,
                                    rawMeaning: parsed.meaning,
                                    isLearnedCategory: false,
                                    isLearnedMeaning: false,
                                    exampleSentence: parsed.exampleSentence,
                                    exampleSentenceYomigana: parsed.exampleSentenceYomigana,
                                };
                                if (parsed.customLabel) {
                                    newEntry.tempLabel = parsed.customLabel;
                                    newEntry.groupMembers = [{
                                        rawWord: parsed.rawWord,
                                        yomigana: parsed.yomigana,
                                        customLabel: parsed.customLabel,
                                        exampleSentence: parsed.exampleSentence,
                                        exampleSentenceYomigana: parsed.exampleSentenceYomigana
                                    }];
                                }
                                newWords.push(newEntry);
                            }
                        }
                    }

                    const finalWords = newWords.map(w => {
                        const scope = SCOPES.find(s => w.page >= s.startPage && w.page <= s.endPage);
                        return {
                            ...w,
                            category: scope ? scope.category : ('その他' as Category)
                        };
                    });

                    await db.transaction('rw', db.words, async () => {
                        for (const page of affectedPages) {
                            await db.words.where('page').equals(page).delete();
                        }
                        await db.words.bulkAdd(finalWords);
                    });

                    // Build Report
                    let mappingStr = '';
                    if (activeStrategy) {
                        const map = activeStrategy.getColumnMapping();
                        const parts = [];
                        for (const [idxStr, dbField] of Object.entries(map)) {
                            const idx = parseInt(idxStr);
                            const headerName = headers[idx] || `Col${idx}`;
                            parts.push(`${headerName}>${dbField}`);
                        }
                        mappingStr = parts.join(', ');
                    }

                    resolve({
                        category: detectedCategory || 'Unknown',
                        count: newWords.length,
                        mapping: mappingStr
                    });
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
