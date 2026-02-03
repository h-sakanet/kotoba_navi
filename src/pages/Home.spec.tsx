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

vi.mock('../components/WeekCard', () => ({
    WeekCard: ({ scope, onClick }: any) => (
        <button onClick={() => onClick(scope)}>open-{scope.id}</button>
    ),
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

        await user.click(screen.getByText('open-TEST-01'));

        expect(mockSetSearchParams).toHaveBeenCalledWith({ modal: 'TEST-01' });
    });

    it('URLパラメータに modal がある場合は ModeModal が表示される', async () => {
        // 日本語コメント: 初期URLにモーダル指定がある場合の表示を確認する
        setSearchParams('modal=TEST-01');
        render(<Home />);

        expect(await screen.findByText('Modal-TEST-01')).toBeInTheDocument();
    });
});
