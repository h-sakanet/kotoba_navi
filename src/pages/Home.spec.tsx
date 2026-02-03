import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from './Home';

// --- モック定義 ---
const { getScopes, setScopes, getSearchParams, setSearchParams, mockSetSearchParams } = vi.hoisted(() => {
    let scopes: any[] = [{ id: 'TEST-01', startPage: 1, endPage: 1, category: 'ことわざ' }];
    let params = new URLSearchParams('');
    const setter = vi.fn((next: any) => {
        if (next instanceof URLSearchParams) {
            params = next;
            return;
        }
        params = new URLSearchParams(next);
    });
    return {
        getScopes: () => scopes,
        setScopes: (next: any[]) => {
            scopes = next;
        },
        getSearchParams: () => params,
        setSearchParams: (value: string) => {
            params = new URLSearchParams(value);
        },
        mockSetSearchParams: setter,
    };
});

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useSearchParams: () => [getSearchParams(), mockSetSearchParams],
    };
});

vi.mock('../data/scope', () => ({
    get SCOPES() {
        return getScopes();
    },
}));

// Mock scheduleService
vi.mock('../services/ScheduleService', () => ({
    scheduleService: {
        getAll: vi.fn().mockResolvedValue([]),
        getNextTestDate: vi.fn().mockReturnValue(null),
    }
}));

// Mock components to avoid rendering complexity
vi.mock('../components/WeekCard', () => ({
    WeekCard: ({ onClick, scope }: any) => (
        <div data-testid="week-card" onClick={() => onClick(scope)}>
            WeekCard
        </div>
    )
}));

vi.mock('../components/ModeModal', () => ({
    ModeModal: ({ scope, onClose }: any) => (
        <div>
            <div>Modal-{scope.id}</div>
            <button onClick={onClose}>close</button>
        </div>
    ),
}));

vi.mock('../components/ImportButton', () => ({
    ImportButton: ({ onImportComplete }: any) => (
        <button onClick={onImportComplete}>import</button>
    ),
}));

describe('Home', () => {
    beforeEach(() => {
        // 日本語コメント: テストごとにスコープと検索パラメータを初期化する
        setScopes([{ id: 'TEST-01', startPage: 1, endPage: 1, category: 'ことわざ' }]);
        setSearchParams('');
        mockSetSearchParams.mockClear();
    });

    it('WeekCardクリックで modal パラメータが更新される', async () => {
        // 日本語コメント: クリックでモーダルが開くパラメータがセットされることを確認する
        const user = userEvent.setup();
        render(<Home />);

        // Wait for the effect to potentially run or just proceed if elements are ready.
        // Since WeekCard is mocked and always rendered, we can click it.
        // However, the "act" warning suggests a state update is pending.
        // We can wait for the mock call if we want to be strict, but effectively just using user events is usually enough.
        // If the act warning persists, it might be due to the promise resolution in the mock.

        const button = await screen.findByText('WeekCard'); // Use findBy to await appearance if needed, though here it's sync.
        await user.click(button);

        expect(mockSetSearchParams).toHaveBeenCalledWith({ modal: 'TEST-01' });
    });

    it('URLパラメータに modal がある場合は ModeModal が表示される', async () => {
        // 日本語コメント: 初期URLにモーダル指定がある場合の表示を確認する
        setSearchParams('modal=TEST-01');
        render(<Home />);

        expect(await screen.findByText('Modal-TEST-01')).toBeInTheDocument();
    });
});
