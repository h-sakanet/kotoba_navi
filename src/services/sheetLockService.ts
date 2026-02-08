import { db } from '../db';

export type LockSide = 'left' | 'right';

export interface SheetLockEntry {
    maskKey: string;
    wordId: number;
    side: LockSide;
}

class SheetLockService {
    private get table() {
        return db.sheetLocks;
    }

    async listByWordIds(wordIds: number[]): Promise<SheetLockEntry[]> {
        if (wordIds.length === 0) return [];
        if (!this.table) return [];
        return this.table.where('wordId').anyOf(wordIds).toArray();
    }

    async setLocked(entry: SheetLockEntry, locked: boolean): Promise<void> {
        if (!this.table) return;
        if (!locked) {
            await this.table.where('maskKey').equals(entry.maskKey).delete();
            return;
        }

        const exists = await this.table.where('maskKey').equals(entry.maskKey).count();
        if (exists > 0) return;
        await this.table.add(entry);
    }

    async setManyLocked(entries: SheetLockEntry[], locked: boolean): Promise<void> {
        if (entries.length === 0) return;
        if (!this.table) return;
        await db.transaction('rw', this.table, async () => {
            for (const entry of entries) {
                if (!locked) {
                    await this.table.where('maskKey').equals(entry.maskKey).delete();
                    continue;
                }

                const exists = await this.table.where('maskKey').equals(entry.maskKey).count();
                if (exists === 0) {
                    await this.table.add(entry);
                }
            }
        });
    }

    async unlockByWordAndSide(wordId: number, side: LockSide): Promise<void> {
        if (!this.table) return;
        await this.table.where('[wordId+side]').equals([wordId, side]).delete();
    }

    async clearAll(): Promise<void> {
        if (!this.table) return;
        await this.table.clear();
    }
}

export const sheetLockService = new SheetLockService();
