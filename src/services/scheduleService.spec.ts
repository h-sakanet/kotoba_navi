import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScheduleService } from './ScheduleService';
import { type Schedule } from '../types';


// Mock Dexie and db structure
const { mockDb, mockSchedulesTable } = vi.hoisted(() => {
    // Mock for where().equals().first() and add/update
    const schedulesTable = {
        add: vi.fn(),
        update: vi.fn(),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        first: vi.fn(), // Will be mocked per test
        toArray: vi.fn(),
        anyOf: vi.fn().mockReturnThis(),
        delete: vi.fn(),
    };

    return {
        mockSchedulesTable: schedulesTable,
        mockDb: {
            transaction: vi.fn((_mode, _tables, callback) => callback()), // Execute callback immediately
            schedules: schedulesTable,
        }
    };
});

vi.mock('../db', () => ({
    db: mockDb
}));

describe('ScheduleService Logic Specification', () => {
    let service: ScheduleService;
    let mockData: Schedule[] = [];

    beforeEach(() => {
        service = new ScheduleService();
        mockData = [
            { scopeId: '42A-01', date: '2026-02-01' },
            { scopeId: '42A-02', date: '2026-02-10' },
            { scopeId: '42A-03', date: '2026-02-17' },
            { scopeId: '42A-22-A', date: '2026-02-24' },
            { scopeId: '42A-22-B', date: '2026-02-24' },
        ];
        // Reset mocks
        vi.clearAllMocks();
    });

    it('次回のテスト日付を正しく特定できること', () => {
        const today = '2026-02-03';
        const nextDate = service.getNextTestDate(today, mockData);
        expect(nextDate).toBe('2026-02-10');
    });

    it('すべてのテストが過去の場合は null を返すこと', () => {
        const today = '2026-03-01';
        const nextDate = service.getNextTestDate(today, mockData);
        expect(nextDate).toBeNull();
    });

    it('当日がテスト日の場合、その日を次回テスト日として含むこと', () => {
        const today = '2026-02-10'; // まさにテスト当日
        const nextDate = service.getNextTestDate(today, mockData);
        expect(nextDate).toBe('2026-02-10');
    });

    it('同じ日付に複数のテストがある場合、すべての ScopeID を返すこと (例: 42A-22)', () => {
        const targetDate = '2026-02-24';
        const scopeIds = service.getScopeIdsByDate(targetDate, mockData);
        expect(scopeIds).toHaveLength(2);
        expect(scopeIds).toContain('42A-22-A');
        expect(scopeIds).toContain('42A-22-B');
    });
    it('deleteBatch deletes specified schedules', async () => {
        // We verify that the DB delete method is called correctly
        const scopeIdsToDelete = ['S1', 'S3'];
        await service.deleteBatch(scopeIdsToDelete);

        // Check chain: db.schedules.where('scopeId').anyOf(['S1', 'S3']).delete()
        expect(mockSchedulesTable.where).toHaveBeenCalledWith('scopeId');
        expect(mockSchedulesTable.anyOf).toHaveBeenCalledWith(scopeIdsToDelete);
        expect(mockSchedulesTable.delete).toHaveBeenCalled();
    });

    it('getAll returns all schedules from db', async () => {
        mockSchedulesTable.toArray.mockResolvedValueOnce(mockData);
        const all = await service.getAll();
        expect(mockSchedulesTable.toArray).toHaveBeenCalledTimes(1);
        expect(all).toEqual(mockData);
    });

    it('saveBatch updates existing schedules and adds new ones', async () => {
        mockSchedulesTable.first
            .mockResolvedValueOnce({ id: 11, scopeId: '42A-01', date: '2026-02-01' })
            .mockResolvedValueOnce(undefined);

        await service.saveBatch([
            { scopeId: '42A-01', date: '2026-02-08' },
            { scopeId: '42A-99', date: '2026-03-01' }
        ]);

        expect(mockSchedulesTable.where).toHaveBeenCalledWith('scopeId');
        expect(mockSchedulesTable.equals).toHaveBeenNthCalledWith(1, '42A-01');
        expect(mockSchedulesTable.equals).toHaveBeenNthCalledWith(2, '42A-99');
        expect(mockSchedulesTable.update).toHaveBeenCalledWith(11, { date: '2026-02-08' });
        expect(mockSchedulesTable.add).toHaveBeenCalledWith({ scopeId: '42A-99', date: '2026-03-01' });
    });

    it('getGroupedScopes merges scopes by displayId', () => {
        const groups = service.getGroupedScopes();
        const merged = groups.find(group => group.some(scope => scope.id === '42A-22') && group.some(scope => scope.id === '42A-22-2'));
        expect(merged).toBeDefined();
        expect(merged?.length).toBe(2);
    });
});
