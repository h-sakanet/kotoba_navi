import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    LearningLogService,
    buildMemberUnitKey,
    buildWordUnitKey,
    type LearningDailyStat
} from './learningLogService';

const { mockDb, table, getRows, resetRows } = vi.hoisted(() => {
    let rows: LearningDailyStat[] = [];
    let seq = 1;

    const getKeyTuple = (row: LearningDailyStat): [string, string] => [row.scopeId, row.date];
    const cmpTuple = (a: [string, string], b: [string, string]): number => {
        if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
        return a[1].localeCompare(b[1]);
    };

    const table = {
        clear: vi.fn(async () => {
            rows = [];
            seq = 1;
        }),
        add: vi.fn(async (entry: Omit<LearningDailyStat, 'id'>) => {
            rows.push({ ...entry, id: seq++ });
        }),
        update: vi.fn(async (id: number, updates: Partial<LearningDailyStat>) => {
            const idx = rows.findIndex(row => row.id === id);
            if (idx < 0) return 0;
            rows[idx] = { ...rows[idx], ...updates };
            return 1;
        }),
        where: vi.fn((field: string) => {
            if (field === 'dailyKey') {
                return {
                    equals: (dailyKey: string) => ({
                        first: async () => rows.find(row => row.dailyKey === dailyKey)
                    })
                };
            }

            if (field === '[scopeId+date]') {
                return {
                    between: (lower: [string, string], upper: [string, string]) => ({
                        toArray: async () => rows.filter(row => {
                            const key = getKeyTuple(row);
                            return cmpTuple(key, lower) >= 0 && cmpTuple(key, upper) <= 0;
                        })
                    })
                };
            }

            throw new Error(`Unexpected where field: ${field}`);
        })
    };

    const db = {
        learningDailyStats: table,
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

describe('LearningLogService', () => {
    let service: LearningLogService;

    beforeEach(() => {
        service = new LearningLogService();
        resetRows();
        vi.clearAllMocks();
    });

    it('unitKey helper が期待通りのキーを返す', () => {
        expect(buildWordUnitKey(42)).toBe('word:42');
        expect(buildMemberUnitKey(42, 1)).toBe('member:42:1');
    });

    it('同一キー・同一イベントは1行に集約して加算される', async () => {
        await service.incrementMany([
            { scopeId: '42A-02', unitKey: 'word:1', side: 'left', eventType: 'reveal', date: '2026-02-10', amount: 1 },
            { scopeId: '42A-02', unitKey: 'word:1', side: 'left', eventType: 'reveal', date: '2026-02-10', amount: 2 }
        ]);

        const rows = getRows();
        expect(rows).toHaveLength(1);
        expect(rows[0].dailyKey).toBe('42A-02|2026-02-10|word:1|left');
        expect(rows[0].revealCount).toBe(3);
        expect(rows[0].testWrongCount).toBe(0);
    });

    it('同一キー・別イベントは同じ行を更新して反映される', async () => {
        await service.incrementMany([
            { scopeId: '42A-02', unitKey: 'word:1', side: 'left', eventType: 'reveal', date: '2026-02-10', amount: 2 },
            { scopeId: '42A-02', unitKey: 'word:1', side: 'left', eventType: 'test_wrong', date: '2026-02-10', amount: 1 },
            { scopeId: '42A-02', unitKey: 'word:1', side: 'left', eventType: 'test_forgot', date: '2026-02-10', amount: 1 }
        ]);

        const rows = getRows();
        expect(rows).toHaveLength(1);
        expect(rows[0].revealCount).toBe(2);
        expect(rows[0].testWrongCount).toBe(1);
        expect(rows[0].testForgotCount).toBe(1);
    });

    it('amount が 0 以下のログは無視される', async () => {
        await service.incrementMany([
            { scopeId: '42A-02', unitKey: 'word:1', side: 'left', eventType: 'reveal', date: '2026-02-10', amount: 0 },
            { scopeId: '42A-02', unitKey: 'word:1', side: 'left', eventType: 'test_correct', date: '2026-02-10', amount: -2 }
        ]);

        expect(getRows()).toHaveLength(0);
    });

    it('getRange は scope/date 範囲で絞り込み、日付順で返す', async () => {
        await service.incrementMany([
            { scopeId: '42A-02', unitKey: 'word:1', side: 'left', eventType: 'reveal', date: '2026-02-12', amount: 1 },
            { scopeId: '42A-02', unitKey: 'word:2', side: 'right', eventType: 'test_correct', date: '2026-02-11', amount: 2 },
            { scopeId: '42A-03', unitKey: 'word:9', side: 'left', eventType: 'reveal', date: '2026-02-11', amount: 5 }
        ]);

        const rows = await service.getRange('42A-02', '2026-02-10', '2026-02-12');
        expect(rows).toHaveLength(2);
        expect(rows[0].date).toBe('2026-02-11');
        expect(rows[1].date).toBe('2026-02-12');
        expect(rows.every(row => row.scopeId === '42A-02')).toBe(true);
    });

    it('clearAll でログを削除できる', async () => {
        await service.incrementMany([
            { scopeId: '42A-02', unitKey: 'word:1', side: 'left', eventType: 'reveal', date: '2026-02-10', amount: 1 }
        ]);

        expect(getRows()).toHaveLength(1);
        await service.clearAll();
        expect(getRows()).toHaveLength(0);
        expect(table.clear).toHaveBeenCalledTimes(1);
    });
});
