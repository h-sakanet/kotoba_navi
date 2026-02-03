import { db } from '../db';
import { type Schedule } from '../types';
import { SCOPES } from '../data/scope';

export class ScheduleService {
    async getAll(): Promise<Schedule[]> {
        return await db.schedules.toArray();
    }

    async saveBatch(newSchedules: Schedule[]): Promise<void> {
        await db.transaction('rw', db.schedules, async () => {
            for (const schedule of newSchedules) {
                // Find existing entry by scopeId to update or insert
                const existing = await db.schedules.where('scopeId').equals(schedule.scopeId).first();
                if (existing) {
                    await db.schedules.update(existing.id!, { date: schedule.date });
                } else {
                    await db.schedules.add(schedule);
                }
            }
        });
    }

    async deleteBatch(scopeIds: string[]): Promise<void> {
        await db.transaction('rw', db.schedules, async () => {
            await db.schedules.where('scopeId').anyOf(scopeIds).delete();
        });
    }

    getNextTestDate(todayStr: string, schedules: Schedule[]): string | null {
        const futureDates = schedules
            .map(s => s.date)
            .filter(d => d >= todayStr)
            .sort();
        return futureDates.length > 0 ? futureDates[0] : null;
    }

    getScopeIdsByDate(dateStr: string, schedules: Schedule[]): string[] {
        return schedules
            .filter(s => s.date === dateStr)
            .map(s => s.scopeId);
    }

    /**
     * Gets grouped scopes for UI display (e.g., merging 42A-22 and 42A-22-2)
     */
    getGroupedScopes() {
        const groups = new Map<string, typeof SCOPES>();

        SCOPES.forEach(scope => {
            const key = scope.displayId || scope.id;
            const existing = groups.get(key) || [];
            groups.set(key, [...existing, scope]);
        });

        // Convert Map to Array of groups, sorted by the ID of the first element
        return Array.from(groups.values());
    }
}

export const scheduleService = new ScheduleService();
