import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sheetLockService, type SheetLockEntry } from './sheetLockService';

const { mockDb, table, getRows, resetRows } = vi.hoisted(() => {
    let rows: Array<SheetLockEntry & { id?: number }> = [];
    let seq = 1;

    const table = {
        where: vi.fn((field: string) => {
            if (field === 'wordId') {
                return {
                    anyOf: (wordIds: number[]) => ({
                        toArray: async () => rows.filter(row => wordIds.includes(row.wordId))
                    })
                };
            }

            if (field === 'maskKey') {
                return {
                    equals: (maskKey: string) => ({
                        count: async () => rows.filter(row => row.maskKey === maskKey).length,
                        delete: async () => {
                            rows = rows.filter(row => row.maskKey !== maskKey);
                        }
                    })
                };
            }

            if (field === '[wordId+side]') {
                return {
                    equals: ([wordId, side]: [number, 'left' | 'right']) => ({
                        delete: async () => {
                            rows = rows.filter(row => !(row.wordId === wordId && row.side === side));
                        }
                    })
                };
            }

            throw new Error(`Unexpected where field: ${field}`);
        }),
        add: vi.fn(async (entry: SheetLockEntry) => {
            rows.push({ ...entry, id: seq++ });
        }),
        clear: vi.fn(async () => {
            rows = [];
            seq = 1;
        })
    };

    const db = {
        sheetLocks: table,
        transaction: vi.fn(async (_mode: string, _target: unknown, callback: () => Promise<void>) => {
            await callback();
        })
    };

    return {
        mockDb: db,
        table,
        getRows: () => rows,
        resetRows: () => {
            rows = [];
            seq = 1;
        }
    };
});

vi.mock('../db', () => ({
    db: mockDb
}));

describe('sheetLockService', () => {
    const entryA: SheetLockEntry = { maskKey: '1-left-group-0', wordId: 1, side: 'left' };
    const entryB: SheetLockEntry = { maskKey: '1-right-group-0', wordId: 1, side: 'right' };
    const entryC: SheetLockEntry = { maskKey: '2-left-group-0', wordId: 2, side: 'left' };

    beforeEach(() => {
        resetRows();
        vi.clearAllMocks();
    });

    it('setLocked(true) は未登録エントリを追加し、重複追加しない', async () => {
        await sheetLockService.setLocked(entryA, true);
        await sheetLockService.setLocked(entryA, true);

        expect(getRows()).toHaveLength(1);
        expect(getRows()[0].maskKey).toBe(entryA.maskKey);
    });

    it('setLocked(false) は対象エントリを削除する', async () => {
        await sheetLockService.setLocked(entryA, true);
        expect(getRows()).toHaveLength(1);

        await sheetLockService.setLocked(entryA, false);
        expect(getRows()).toHaveLength(0);
    });

    it('listByWordIds は指定wordIdのみ返す', async () => {
        await sheetLockService.setLocked(entryA, true);
        await sheetLockService.setLocked(entryB, true);
        await sheetLockService.setLocked(entryC, true);

        const rows = await sheetLockService.listByWordIds([1]);
        expect(rows).toHaveLength(2);
        expect(rows.every(row => row.wordId === 1)).toBe(true);
    });

    it('setManyLocked(true/false) で一括反映できる', async () => {
        await sheetLockService.setManyLocked([entryA, entryB], true);
        expect(getRows()).toHaveLength(2);

        await sheetLockService.setManyLocked([entryA], false);
        expect(getRows()).toHaveLength(1);
        expect(getRows()[0].maskKey).toBe(entryB.maskKey);
    });

    it('unlockByWordAndSide は対象sideのみ解除する', async () => {
        await sheetLockService.setManyLocked([entryA, entryB], true);
        await sheetLockService.unlockByWordAndSide(1, 'left');

        expect(getRows()).toHaveLength(1);
        expect(getRows()[0].side).toBe('right');
    });

    it('clearAll は全件削除する', async () => {
        await sheetLockService.setManyLocked([entryA, entryB, entryC], true);
        expect(getRows()).toHaveLength(3);

        await sheetLockService.clearAll();
        expect(getRows()).toHaveLength(0);
        expect(table.clear).toHaveBeenCalledTimes(1);
    });
});
