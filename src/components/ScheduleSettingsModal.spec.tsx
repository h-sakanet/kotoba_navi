import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ScheduleSettingsModal } from './ScheduleSettingsModal';

// --- Mocks ---
const { mockSaveSchedule, mockGetSchedule, mockGetGroupedScopes } = vi.hoisted(() => {
    return {
        mockSaveSchedule: vi.fn(),
        mockGetSchedule: vi.fn(),
        mockGetGroupedScopes: vi.fn(),
    };
});

vi.mock('../services/ScheduleService', () => ({
    scheduleService: {
        saveSchedule: mockSaveSchedule,
        getSchedule: mockGetSchedule,
        getAll: mockGetSchedule, // Fix: Component calls getAll, mapping to same mock for now
        getGroupedScopes: mockGetGroupedScopes,
    }
}));

// Mock Date to ensure calendar consistency (Mocking 'today' as 2024-01-01)
const MOCK_DATE = new Date(2024, 0, 1); // Jan 1 2024 (Monday)

describe('ScheduleSettingsModal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_DATE);
        mockGetSchedule.mockResolvedValue([]);
        mockGetGroupedScopes.mockResolvedValue({}); // Return empty object or minimal structure
        mockSaveSchedule.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('曜日ヘッダーをクリックすると、その月のその曜日の全日付が選択される（未選択がある場合）', async () => {
        // 2024年1月 (Jan)
        // 1(Mon), 8(Mon), 15(Mon), 22(Mon), 29(Mon) -> 5 Mondays

        // Initial state: No dates selected
        render(<ScheduleSettingsModal onClose={() => { }} />);

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
});

