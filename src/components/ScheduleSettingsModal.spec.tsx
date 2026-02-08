import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { ScheduleSettingsModal } from './ScheduleSettingsModal';
import type { Scope } from '../types';

// --- Mocks ---
const {
    mockSaveBatch,
    mockDeleteBatch,
    mockGetAll,
    mockGetGroupedScopes
} = vi.hoisted(() => {
    return {
        mockSaveBatch: vi.fn(),
        mockDeleteBatch: vi.fn(),
        mockGetAll: vi.fn(),
        mockGetGroupedScopes: vi.fn(),
    };
});

vi.mock('../services/ScheduleService', () => ({
    scheduleService: {
        saveBatch: mockSaveBatch,
        deleteBatch: mockDeleteBatch,
        getAll: mockGetAll,
        getGroupedScopes: mockGetGroupedScopes,
    }
}));

// Mock Date to ensure calendar consistency (Mocking 'today' as 2024-01-01)
const MOCK_DATE = new Date(2024, 0, 1); // Jan 1 2024 (Monday)
const SCOPE_A: Scope = { id: '42A-01', startPage: 1, endPage: 2, category: 'ことわざ' };
const SCOPE_B1: Scope = { id: '42A-22', startPage: 34, endPage: 36, category: '似た意味のことわざ' };
const SCOPE_B2: Scope = { id: '42A-22-2', displayId: '42A-22', startPage: 37, endPage: 39, category: '対になることわざ' };

describe('ScheduleSettingsModal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_DATE);
        mockGetAll.mockResolvedValue([]);
        mockGetGroupedScopes.mockReturnValue([]); // Sync API: component reads return value directly
        mockSaveBatch.mockResolvedValue(undefined);
        mockDeleteBatch.mockResolvedValue(undefined);
        mockSaveBatch.mockClear();
        mockDeleteBatch.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('曜日ヘッダーをクリックすると、その月のその曜日の全日付が選択される（未選択がある場合）', async () => {
        // 2024年1月 (Jan)
        // 1(Mon), 8(Mon), 15(Mon), 22(Mon), 29(Mon) -> 5 Mondays

        // Initial state: No dates selected
        render(<ScheduleSettingsModal onClose={() => { }} />);
        await act(async () => {
            await Promise.resolve();
        });

        // Find 2024 Jan container
        const monthHeader = screen.getByText(/2024\s*年\s*1\s*月/);
        const monthSection = monthHeader.closest('div.break-inside-avoid'); // Adjust selector based on actual generic div structure if needed
        expect(monthSection).toBeInTheDocument();

        // Find "Mon" (月) in THIS month
        const monHeader = within(monthSection as HTMLElement).getByText('月');

        fireEvent.click(monHeader);

        // Find days in THIS month
        const day1 = within(monthSection as HTMLElement).getByText('1', { selector: 'button' });
        const day8 = within(monthSection as HTMLElement).getByText('8', { selector: 'button' });
        const day29 = within(monthSection as HTMLElement).getByText('29', { selector: 'button' });

        expect(day1).toHaveClass('bg-blue-600');
        expect(day8).toHaveClass('bg-blue-600');
        expect(day29).toHaveClass('bg-blue-600');
    });

    it('曜日ヘッダーをクリックすると、その月のその曜日の全日付が解除される（全て選択済みの場合）', async () => {
        // Pre-select logic would be needed, OR we can click twice.
        // Click 1: Select All
        // Click 2: Deselect All

        render(<ScheduleSettingsModal onClose={() => { }} />);
        await act(async () => {
            await Promise.resolve();
        });

        const monthHeader = screen.getByText(/2024\s*年\s*1\s*月/);
        const monthSection = monthHeader.closest('div.break-inside-avoid');
        const monHeader = within(monthSection as HTMLElement).getByText('月');

        // First Click -> Select All
        fireEvent.click(monHeader);

        const day1 = within(monthSection as HTMLElement).getByText('1', { selector: 'button' });
        expect(day1).toHaveClass('bg-blue-600');

        // Second Click -> Deselect All
        fireEvent.click(monHeader);

        expect(day1).not.toHaveClass('bg-blue-600');
    });

    it('保存時に割り当て済みは saveBatch、未割り当ては deleteBatch へ渡される', async () => {
        mockGetAll.mockResolvedValue([
            { scopeId: '42A-01', date: '2024-01-08' }
        ]);
        mockGetGroupedScopes.mockReturnValue([
            [SCOPE_A],
            [SCOPE_B1, SCOPE_B2]
        ]);
        const onClose = vi.fn();

        render(<ScheduleSettingsModal onClose={onClose} />);
        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            fireEvent.click(screen.getByText('保存'));
            await Promise.resolve();
        });

        expect(mockSaveBatch).toHaveBeenCalledTimes(1);
        expect(mockSaveBatch).toHaveBeenCalledWith([
            { scopeId: '42A-01', date: '2024-01-08' }
        ]);
        expect(mockDeleteBatch).toHaveBeenCalledWith(['42A-22', '42A-22-2']);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('全scopeが割り当て済みなら deleteBatch を呼ばない', async () => {
        mockGetAll.mockResolvedValue([
            { scopeId: '42A-01', date: '2024-01-08' },
            { scopeId: '42A-22', date: '2024-01-15' },
            { scopeId: '42A-22-2', date: '2024-01-15' }
        ]);
        mockGetGroupedScopes.mockReturnValue([
            [SCOPE_A],
            [SCOPE_B1, SCOPE_B2]
        ]);

        render(<ScheduleSettingsModal onClose={() => { }} />);
        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            fireEvent.click(screen.getByText('保存'));
            await Promise.resolve();
        });

        expect(mockSaveBatch).toHaveBeenCalledTimes(1);
        expect(mockDeleteBatch).not.toHaveBeenCalled();
    });

    it('キャンセルボタンで onClose が呼ばれる', async () => {
        const onClose = vi.fn();
        render(<ScheduleSettingsModal onClose={onClose} />);
        await act(async () => {
            await Promise.resolve();
        });

        fireEvent.click(screen.getByText('キャンセル'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('個別日付クリックで選択/解除が切り替わる', async () => {
        render(<ScheduleSettingsModal onClose={() => { }} />);
        await act(async () => {
            await Promise.resolve();
        });

        const monthHeader = screen.getByText(/2024\s*年\s*1\s*月/);
        const monthSection = monthHeader.closest('div.break-inside-avoid');
        const day2 = within(monthSection as HTMLElement).getByText('2', { selector: 'button' });

        fireEvent.click(day2);
        expect(day2).toHaveClass('bg-blue-600');

        fireEvent.click(day2);
        expect(day2).not.toHaveClass('bg-blue-600');
    });
});
