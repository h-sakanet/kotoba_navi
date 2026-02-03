import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportButton } from './ImportButton';

const { mockImport } = vi.hoisted(() => {
    return {
        mockImport: vi.fn(),
    };
});

vi.mock('../utils/csvImporter', () => ({
    parseAndImportCSV: (...args: any[]) => mockImport(...args),
}));

describe('ImportButton', () => {
    beforeEach(() => {
        // 日本語コメント: テストごとにモックを初期化する
        mockImport.mockClear();
        mockImport.mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        vi.spyOn(window, 'alert').mockImplementation(() => { });
    });

    it('CSVインポートが確定すると処理が呼ばれる', async () => {
        // 日本語コメント: confirmがtrueの場合にインポートが呼ばれることを確認する
        const user = userEvent.setup();
        const onImportComplete = vi.fn();
        const { container } = render(<ImportButton onImportComplete={onImportComplete} />);

        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });

        await user.upload(input, file);

        expect(mockImport).toHaveBeenCalledWith(file);
        expect(onImportComplete).toHaveBeenCalled();
    });

    it('confirmがキャンセルの場合はインポートされない', async () => {
        // 日本語コメント: confirmがfalseの場合にインポートが呼ばれないことを確認する
        (window.confirm as unknown as Mock).mockReturnValueOnce(false);

        const user = userEvent.setup();
        const onImportComplete = vi.fn();
        const { container } = render(<ImportButton onImportComplete={onImportComplete} />);

        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });

        await user.upload(input, file);

        expect(mockImport).not.toHaveBeenCalled();
        expect(onImportComplete).not.toHaveBeenCalled();
    });

    it('インポート失敗時はエラーメッセージが表示される', async () => {
        // 日本語コメント: parseAndImportCSVが失敗した場合の分岐を確認する
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        mockImport.mockRejectedValueOnce(new Error('fail'));

        const user = userEvent.setup();
        const onImportComplete = vi.fn();
        const { container } = render(<ImportButton onImportComplete={onImportComplete} />);

        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });

        await user.upload(input, file);

        expect(errorSpy).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('インポートに失敗しました。');
        expect(onImportComplete).not.toHaveBeenCalled();

        errorSpy.mockRestore();
    });

    it('ボタンクリックでファイル入力のクリックが呼ばれる', async () => {
        // 日本語コメント: CSVボタンがファイル入力を起動することを確認する
        const user = userEvent.setup();
        const { container } = render(<ImportButton onImportComplete={vi.fn()} />);

        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = vi.spyOn(input, 'click');

        const button = container.querySelector('button[title="CSVインポート"]') as HTMLButtonElement;
        await user.click(button);

        expect(clickSpy).toHaveBeenCalled();
    });
});
