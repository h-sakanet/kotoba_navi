import { db } from '../db';

export type LearningSide = 'left' | 'right';
export type LearningEventType = 'reveal' | 'test_correct' | 'test_wrong' | 'test_forgot';

export interface LearningDailyStat {
    id?: number;
    dailyKey: string;
    scopeId: string;
    date: string;
    unitKey: string;
    side: LearningSide;
    revealCount: number;
    testCorrectCount: number;
    testWrongCount: number;
    testForgotCount: number;
    updatedAt: string;
}

export interface LearningLogIncrement {
    scopeId: string;
    unitKey: string;
    side: LearningSide;
    eventType: LearningEventType;
    date?: string;
    amount?: number;
}

type CounterFields = Pick<LearningDailyStat, 'revealCount' | 'testCorrectCount' | 'testWrongCount' | 'testForgotCount'>;

const createEmptyCounters = (): CounterFields => ({
    revealCount: 0,
    testCorrectCount: 0,
    testWrongCount: 0,
    testForgotCount: 0
});

const toLocalDateKey = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const buildWordUnitKey = (wordId: number): string => `word:${wordId}`;
export const buildMemberUnitKey = (wordId: number, memberIndex: number): string => `member:${wordId}:${memberIndex}`;

const buildDailyKey = (scopeId: string, date: string, unitKey: string, side: LearningSide): string =>
    `${scopeId}|${date}|${unitKey}|${side}`;

const applyIncrement = (
    counters: CounterFields,
    eventType: LearningEventType,
    amount: number
): CounterFields => {
    const next = { ...counters };
    if (eventType === 'reveal') next.revealCount += amount;
    if (eventType === 'test_correct') next.testCorrectCount += amount;
    if (eventType === 'test_wrong') next.testWrongCount += amount;
    if (eventType === 'test_forgot') next.testForgotCount += amount;
    return next;
};

export class LearningLogService {
    private get table() {
        return db.learningDailyStats;
    }

    async clearAll(): Promise<void> {
        if (!db.learningDailyStats) return;
        await db.learningDailyStats.clear();
    }

    async incrementMany(logs: LearningLogIncrement[]): Promise<void> {
        if (!db.learningDailyStats || logs.length === 0) return;

        const grouped = new Map<string, LearningLogIncrement>();
        for (const log of logs) {
            const amount = log.amount ?? 1;
            if (amount <= 0) continue;

            const date = log.date || toLocalDateKey();
            const dailyKey = buildDailyKey(log.scopeId, date, log.unitKey, log.side);
            const existing = grouped.get(dailyKey);

            if (!existing) {
                grouped.set(dailyKey, { ...log, date, amount });
                continue;
            }

            if (existing.eventType === log.eventType) {
                existing.amount = (existing.amount ?? 1) + amount;
            } else {
                // Merge different event types for same daily key by splitting into synthetic key
                const mergedKey = `${dailyKey}|${log.eventType}`;
                grouped.set(mergedKey, { ...log, date, amount });
            }
        }

        await db.transaction('rw', this.table, async () => {
            for (const entry of grouped.values()) {
                const date = entry.date || toLocalDateKey();
                const dailyKey = buildDailyKey(entry.scopeId, date, entry.unitKey, entry.side);
                const amount = entry.amount ?? 1;
                const nowIso = new Date().toISOString();
                const found = await this.table.where('dailyKey').equals(dailyKey).first();

                if (!found) {
                    const counters = applyIncrement(createEmptyCounters(), entry.eventType, amount);
                    await this.table.add({
                        dailyKey,
                        scopeId: entry.scopeId,
                        date,
                        unitKey: entry.unitKey,
                        side: entry.side,
                        ...counters,
                        updatedAt: nowIso
                    });
                    continue;
                }

                const updatedCounters = applyIncrement({
                    revealCount: found.revealCount,
                    testCorrectCount: found.testCorrectCount,
                    testWrongCount: found.testWrongCount,
                    testForgotCount: found.testForgotCount
                }, entry.eventType, amount);

                await this.table.update(found.id!, {
                    ...updatedCounters,
                    updatedAt: nowIso
                });
            }
        });
    }

    async getRange(scopeId: string, startDate: string, endDate: string): Promise<LearningDailyStat[]> {
        if (!db.learningDailyStats) return [];

        const rows = await this.table
            .where('[scopeId+date]')
            .between([scopeId, startDate], [scopeId, endDate], true, true)
            .toArray();

        return rows.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            if (a.unitKey !== b.unitKey) return a.unitKey.localeCompare(b.unitKey);
            return a.side.localeCompare(b.side);
        });
    }
}

export const learningLogService = new LearningLogService();
export const learningLogDateKey = toLocalDateKey;
