import Papa from 'papaparse';
import { db } from '../db';
import { type Word, type Category, type GroupMember } from '../types';
import { type ImportStrategy } from './importers/ImportStrategy';
import { findScopeByPage } from '../data/scope';
import { getFallbackImporters, getImporterForCategory } from './importers/importerRegistry';

interface TempWord extends Word {
    tempLabel?: string;
}

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

                    const newWords: Word[] = [];
                    const affectedPages = new Set<number>();
                    const fallbackStrategies = getFallbackImporters();

                    let detectedCategory = '';
                    let activeStrategy: ImportStrategy | undefined;

                    for (let i = startIndex; i < data.length; i++) {
                        const row = data[i];
                        const page = parseInt(row[0]);
                        const scope = !isNaN(page) ? findScopeByPage(page) : undefined;
                        if (scope && !detectedCategory) {
                            detectedCategory = scope.category;
                        }

                        const candidateStrategies: ImportStrategy[] = scope
                            ? [getImporterForCategory(scope.category)]
                            : fallbackStrategies;

                        let strategy: ImportStrategy | undefined;
                        let parsedResult: ReturnType<ImportStrategy['parseRow']> | null = null;

                        for (const candidate of candidateStrategies) {
                            // For scope-matched rows, category strategy is authoritative.
                            // For unknown pages, use canHandle-based fallback.
                            if (!scope && !candidate.canHandle(row)) {
                                continue;
                            }

                            const parsed = candidate.parseRow(row);
                            if (!parsed) continue;

                            strategy = candidate;
                            parsedResult = parsed;
                            break;
                        }

                        if (!strategy || !parsedResult) continue;
                        if (!activeStrategy) activeStrategy = strategy;

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
                        const scope = findScopeByPage(w.page);
                        return {
                            ...w,
                            category: scope ? scope.category : ('その他' as Category)
                        };
                    });

                    if (db.sheetLocks) {
                        await db.sheetLocks.clear();
                    }
                    if (db.learningDailyStats) {
                        await db.learningDailyStats.clear();
                    }

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
