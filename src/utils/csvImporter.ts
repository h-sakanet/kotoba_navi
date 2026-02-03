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
import { HomonymImporter } from './importers/HomonymImporter';
import { ProverbGroupImporter } from './importers/ProverbGroupImporter';

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

                    // Import SCOPES dynamically to use for strategy selection
                    const { SCOPES } = await import('../data/scope.ts');

                    // Validation: Check if first column is likely a page number (numeric)
                    let startIndex = 0;
                    if (isNaN(parseInt(data[0][0]))) {
                        startIndex = 1;
                    }

                    const newWords: Word[] = [];
                    const affectedPages = new Set<number>();

                    // Initialize strategies
                    // Order matters: specific importers first, then generic/standard
                    const strategies: ImportStrategy[] = [
                        new PositionImporter(),
                        new SynonymImporter(),
                        new PairedIdiomImporter(),
                        new HomonymImporter(),
                        new ProverbGroupImporter(),
                        new IdiomImporter(),
                        new StandardImporter()
                    ];

                    for (let i = startIndex; i < data.length; i++) {
                        const row = data[i];

                        // Find matching strategy
                        // NEW LOGIC: Use Page to determing Category, then select Strategy.
                        const page = parseInt(row[0]);
                        let strategy: ImportStrategy | undefined;

                        if (!isNaN(page)) {
                            // Find scope for this page
                            const scope = SCOPES.find(s => page >= s.startPage && page <= s.endPage);
                            if (scope) {
                                switch (scope.category) {
                                    case '同音異義語':
                                    case '同訓異字':
                                        strategy = strategies.find(s => s instanceof HomonymImporter);
                                        break;
                                    case '似た意味のことわざ':
                                    case '対になることわざ':
                                        strategy = strategies.find(s => s instanceof ProverbGroupImporter);
                                        break;
                                    case '類義語':
                                    case '対義語':
                                    case '上下で対となる熟語': // Paired words
                                        // These use SynonymImporter or PairedIdiomImporter?
                                        // SynonymImporter handles 10 cols.
                                        // PairedIdiomImporter handles ?
                                        // Let's rely on canHandle for these mixed ones if ambiguous, 
                                        // OR explicitly check.
                                        // SynonymImporter handles '類義語' and '対義語' usually.
                                        if (scope.category === '類義語' || scope.category === '対義語') {
                                            strategy = strategies.find(s => s instanceof SynonymImporter);
                                        }
                                        break;
                                    case '慣用句':
                                        strategy = strategies.find(s => s instanceof IdiomImporter);
                                        break;
                                    case 'ことわざ':
                                    case '四字熟語':
                                    case '三字熟語':
                                        strategy = strategies.find(s => s instanceof StandardImporter);
                                        break;
                                }
                            }
                        }

                        // Fallback to original heuristic if no strategy forced or forced strategy failed canHandle
                        if (!strategy || !strategy.canHandle(row)) {
                            strategy = strategies.find(s => s.canHandle(row));
                        }

                        if (!strategy) continue;

                        const parsedResult = strategy.parseRow(row);
                        if (!parsedResult) continue;

                        const parsedRows = Array.isArray(parsedResult) ? parsedResult : [parsedResult];

                        for (const parsed of parsedRows) {
                            affectedPages.add(parsed.page);

                            // Grouping logic:
                            const existingIndex = newWords.findIndex(w => w.page === parsed.page && w.numberInPage === parsed.numberInPage);

                            if (existingIndex !== -1) {
                                // Append to existing
                                const existing = newWords[existingIndex];
                                const newMember: GroupMember = { rawWord: parsed.rawWord, yomigana: parsed.yomigana };
                                if (parsed.customLabel) newMember.customLabel = parsed.customLabel;
                                if (parsed.exampleSentence) newMember.exampleSentence = parsed.exampleSentence;
                                if (parsed.exampleSentenceYomigana) newMember.exampleSentenceYomigana = parsed.exampleSentenceYomigana;

                                if (!existing.groupMembers) {
                                    // Initialize groupMembers with the existing primary one + this new one
                                    const firstMember: GroupMember = { rawWord: existing.rawWord, yomigana: existing.yomigana || '' };
                                    if ((existing as TempWord).tempLabel) {
                                        firstMember.customLabel = (existing as TempWord).tempLabel;
                                    }
                                    if (existing.exampleSentence) {
                                        firstMember.exampleSentence = existing.exampleSentence;
                                    }
                                    if (existing.exampleSentenceYomigana) {
                                        firstMember.exampleSentenceYomigana = existing.exampleSentenceYomigana;
                                    }
                                    existing.groupMembers = [firstMember, newMember];
                                } else {
                                    existing.groupMembers.push(newMember);
                                }
                            } else {
                                // Create new
                                const newEntry: TempWord = {
                                    page: parsed.page,
                                    numberInPage: parsed.numberInPage,
                                    category: 'ことわざ', // Default, will be updated
                                    question: parsed.question || parsed.meaning, // Meaning by default, or override
                                    answer: parsed.rawWord,   // Word/Kotowaza (Representative)
                                    rawWord: parsed.rawWord,
                                    yomigana: parsed.yomigana,
                                    rawMeaning: parsed.meaning,
                                    isLearnedCategory: false,
                                    isLearnedMeaning: false,
                                    exampleSentence: parsed.exampleSentence,
                                    exampleSentenceYomigana: parsed.exampleSentenceYomigana,
                                };

                                // If this row has a position, store it temporarily or init groupMembers
                                if (parsed.customLabel) {
                                    newEntry.tempLabel = parsed.customLabel; // Temporary field to help grouping later
                                    // Also init groupMembers immediately?
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

                    // Now we need to look up categories. 
                    // SCOPES already imported at top.

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
