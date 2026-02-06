import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordList } from './WordList';
import { useParams } from 'react-router-dom';

// --- Mocks ---
const { mockNavigate, getWords, setWords, getScopes, setScopes } = vi.hoisted(() => {
    let words: any[] = [];
    let scopes: { id: string; category: string; startPage: number; endPage: number }[] = [{ id: 'MASK-01', category: 'ことわざ', startPage: 1, endPage: 1 }];
    return {
        mockNavigate: vi.fn(),
        getWords: () => words,
        setWords: (next: any[]) => { words = next; },
        getScopes: () => scopes,
        setScopes: (next: any[]) => { scopes = next; },
    };
});

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn().mockReturnValue({ scopeId: 'MASK-01' }),
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../db', () => ({
    db: {
        words: {
            where: () => ({
                between: () => ({
                    sortBy: () => Promise.resolve([...getWords()]),
                }),
            }),
            update: vi.fn(),
        },
    },
}));

vi.mock('../data/scope', () => ({
    get SCOPES() { return getScopes(); },
    findScopeById: (id: string) => getScopes().find(s => s.id === id),
}));

describe('WordList Masking Feature', () => {
    beforeEach(() => {
        (useParams as any).mockReturnValue({ scopeId: 'MASK-01' });
        setScopes([{ id: 'MASK-01', category: 'ことわざ', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 1,
                page: 1,
                numberInPage: 1,
                category: 'ことわざ',
                rawWord: 'マスク単語',
                yomigana: 'ますくたんご',
                rawMeaning: 'マスクの意味',
                groupMembers: [
                    { rawWord: 'マスク単語', yomigana: 'ますくたんご' } // Proverb structure
                ],
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);
    });

    it('「ことわざ」カテゴリでは左右の隠すトグルが表示される', async () => {
        render(<WordList />);

        // Wait for data load
        await screen.findByText('マスク単語');

        // Check for toggles in header
        // Since there are two "隠す" labels (one for left, one for right)
        const toggles = screen.getAllByText('隠す');
        expect(toggles.length).toBe(2);
    });

    it('左の「隠す」をONにすると左カラムがマスクされる', async () => {
        const user = userEvent.setup();
        render(<WordList />);
        await screen.findByText('マスク単語');

        const toggles = screen.getAllByText('隠す');
        const leftToggleLabel = toggles[0].closest('label'); // Assuming first is left

        // Click Left Toggle
        await user.click(leftToggleLabel!);

        // Verify Overlay appears. 
        // We look for the overlay div with title "タップで表示" (since it starts Hidden/Opaque)
        const overlays = screen.getAllByTitle('タップで表示');
        expect(overlays.length).toBeGreaterThan(0);

        // Verify it is opaque (pink background -> blue background)
        expect(overlays[0]).toHaveClass('bg-[#2B7FFF]');
    });

    it('排他制御：左ONの状態で右ONにすると左がOFFになる', async () => {
        const user = userEvent.setup();
        render(<WordList />);
        await screen.findByText('マスク単語');

        const toggles = screen.getAllByText('隠す');
        const leftLabel = toggles[0].closest('label'); // Left
        const rightLabel = toggles[1].closest('label'); // Right

        // Turn ON Left
        await user.click(leftLabel!);
        const leftCheckbox = leftLabel?.querySelector('input');
        expect(leftCheckbox).toBeChecked();

        // Turn ON Right
        await user.click(rightLabel!);
        const rightCheckbox = rightLabel?.querySelector('input');

        // Use waitFor because state updates might be batched
        await waitFor(() => {
            expect(rightCheckbox).toBeChecked();
            expect(leftCheckbox).not.toBeChecked();
        });
    });

    it('マスクシートをタップすると透明化（表示）され、もう一度タップすると隠れる', async () => {
        const user = userEvent.setup();
        render(<WordList />);
        await screen.findByText('マスク単語');

        // Turn ON Left Mask
        const toggles = screen.getAllByText('隠す');
        await user.click(toggles[0].closest('label')!);

        // Find the overlay
        // Use getAllByTitle because there might be multiple masked groups (e.g. yomigana + word)
        const overlays = screen.getAllByTitle('タップで表示');
        expect(overlays.length).toBeGreaterThan(0);
        const overlay = overlays[0];

        expect(overlay).toHaveClass('bg-[#2B7FFF]'); // Opaque

        // Click the overlay to Reveal
        fireEvent.click(overlay);

        await waitFor(() => {
            // Title changes to "タップで隠す"
            expect(overlay).toHaveAttribute('title', 'タップで隠す');
            // Class changes to transparent-ish
            expect(overlay).toHaveClass('bg-[#2B7FFF]/20');
        });

        // Click again to Hide
        fireEvent.click(overlay);

        await waitFor(() => {
            expect(overlay).toHaveAttribute('title', 'タップで表示');
            expect(overlay).toHaveClass('bg-[#2B7FFF]');
        });
    });

    it('マスク中は編集ボタンが無効化される', async () => {
        const user = userEvent.setup();
        render(<WordList />);
        await screen.findByText('マスク単語');

        // Initially enabled (Edit icon present)
        const row = screen.getByText('マスク単語').closest('tr');
        const editBtn = row?.querySelector('button svg.lucide-pen')?.closest('button');
        expect(editBtn).not.toBeDisabled();

        // Turn ON Mask
        const toggles = screen.getAllByText('隠す');
        await user.click(toggles[0].closest('label')!);

        // Should be disabled now
        await waitFor(() => {
            expect(editBtn).toBeDisabled();
            expect(editBtn).toHaveClass('cursor-not-allowed');
        });
    });

    it('類義語カテゴリでもマスクが機能する', async () => {
        // Setup Synonym Data
        (useParams as any).mockReturnValue({ scopeId: 'MASK-SYN' });
        setScopes([{ id: 'MASK-SYN', category: '類義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 100,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                groupMembers: [
                    { yomigana: 'るいぎご1', rawWord: '類義語1', customLabel: 'A' },
                    { yomigana: 'るいぎご2', rawWord: '類義語2', customLabel: 'B' }
                ],
                isLearnedCategory: false
            }
        ]);

        const user = userEvent.setup();
        render(<WordList />);
        await screen.findByText('類義語1');

        // Check Toggles
        const toggles = screen.getAllByText('隠す');
        expect(toggles.length).toBe(2);

        // Turn ON Left Mask
        await user.click(toggles[0].closest('label')!);

        // Expect Mask on Left (Member 0 - '類義語1')
        // We find the mask that is over '類義語1'.
        // The mask is a sibling of the content in the same relative container.
        const wordElement = screen.getByText('類義語1');
        const wrapper = wordElement.closest('.relative');
        const mask = wrapper?.querySelector('[title="タップで表示"]');

        expect(mask).toBeInTheDocument();
        expect(mask).toHaveClass('bg-[#2B7FFF]');

        // Turn ON Right Mask
        await user.click(toggles[1].closest('label')!);

        // Expect Mask on Right (Member 1 - '類義語2')
        const wordElement2 = screen.getByText('類義語2');
        const wrapper2 = wordElement2.closest('.relative');
        const mask2 = wrapper2?.querySelector('[title="タップで表示"]');

        expect(mask2).toBeInTheDocument();
        expect(mask2).toHaveClass('bg-[#2B7FFF]');
    });

    it('類義語の右パネル編集は右メンバーだけを更新する', async () => {
        (useParams as any).mockReturnValue({ scopeId: 'MASK-SYN-EDIT' });
        setScopes([{ id: 'MASK-SYN-EDIT', category: '類義語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 200,
                page: 1,
                numberInPage: 1,
                category: '類義語',
                groupMembers: [
                    { yomigana: 'るいぎご1', rawWord: '類義語1', customLabel: 'A' },
                    { yomigana: 'るいぎご2', rawWord: '類義語2', customLabel: 'B' }
                ],
                isLearnedCategory: false
            }
        ]);

        const user = userEvent.setup();
        render(<WordList />);
        await screen.findByText('類義語1');
        await screen.findByText('類義語2');

        const row = screen.getByText('類義語1').closest('tr');
        const editBtn = row?.querySelector('button svg.lucide-pen')?.closest('button');
        expect(editBtn).toBeInTheDocument();
        await user.click(editBtn!);

        const rightWordInput = screen.getByDisplayValue('類義語2');
        await user.clear(rightWordInput);
        await user.type(rightWordInput, '右更新');

        const saveBtn = row?.querySelector('button svg.lucide-save')?.closest('button');
        expect(saveBtn).toBeInTheDocument();
        await user.click(saveBtn!);

        await screen.findByText('類義語1');
        await screen.findByText('右更新');
        expect(screen.queryByText('類義語2')).not.toBeInTheDocument();
    });

    it('四字熟語カテゴリでは左右の隠すトグルが表示される', async () => {
        (useParams as any).mockReturnValue({ scopeId: 'MASK-YOJI' });
        setScopes([{ id: 'MASK-YOJI', category: '四字熟語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 301,
                page: 1,
                numberInPage: 1,
                category: '四字熟語',
                rawWord: '四字熟語',
                yomigana: 'よじじゅくご',
                rawMeaning: '意味',
                exampleSentence: '例文',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<WordList />);
        await screen.findByText('四字熟語');
        expect(screen.getAllByText('隠す')).toHaveLength(2);
    });

    it('三字熟語カテゴリでは左右の隠すトグルが表示される', async () => {
        (useParams as any).mockReturnValue({ scopeId: 'MASK-SANJI' });
        setScopes([{ id: 'MASK-SANJI', category: '三字熟語', startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 302,
                page: 1,
                numberInPage: 1,
                category: '三字熟語',
                rawWord: '三字熟語',
                yomigana: 'さんじじゅくご',
                rawMeaning: '意味',
                exampleSentence: '例文',
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        render(<WordList />);
        await screen.findByText('三字熟語');
        expect(screen.getAllByText('隠す')).toHaveLength(2);
    });

    it.each(['同音異義語', '同訓異字'])('%sの右パネルは行ごとにマスクされ、例文系は隠れない', async (category) => {
        const scopeId = category === '同音異義語' ? 'MASK-HOMO' : 'MASK-DOUKUN';
        (useParams as any).mockReturnValue({ scopeId });
        setScopes([{ id: scopeId, category: category as any, startPage: 1, endPage: 1 }]);
        setWords([
            {
                id: 400,
                page: 1,
                numberInPage: 1,
                category,
                rawWord: 'はし',
                yomigana: 'はし',
                rawMeaning: '',
                groupMembers: [
                    { rawWord: '橋', yomigana: 'はし', exampleSentenceYomigana: 'はしをわたる', exampleSentence: '橋を渡る' },
                    { rawWord: '箸', yomigana: 'はし', exampleSentenceYomigana: 'はしをつかう', exampleSentence: '箸を使う' }
                ],
                isLearnedCategory: false,
                isLearnedMeaning: false,
            },
        ]);

        const user = userEvent.setup();
        render(<WordList />);
        await screen.findByText('橋');
        await screen.findByText('箸');

        // right only toggle
        const toggles = screen.getAllByText('隠す');
        expect(toggles).toHaveLength(1);
        await user.click(toggles[0].closest('label')!);

        // row-level overlays
        const overlays = screen.getAllByTitle('タップで表示');
        expect(overlays).toHaveLength(2);

        // example fields remain visible
        const exYomi1 = screen.getByText('はしをわたる');
        const ex1 = screen.getByText('橋を渡る');
        const exYomi2 = screen.getByText('はしをつかう');
        const ex2 = screen.getByText('箸を使う');
        expect(exYomi1).toBeInTheDocument();
        expect(ex1).toBeInTheDocument();
        expect(exYomi2).toBeInTheDocument();
        expect(ex2).toBeInTheDocument();
        expect(exYomi1.closest('[title="タップで表示"]')).toBeNull();
        expect(ex1.closest('[title="タップで表示"]')).toBeNull();
        expect(exYomi2.closest('[title="タップで表示"]')).toBeNull();
        expect(ex2.closest('[title="タップで表示"]')).toBeNull();

        // independent reveal state per row
        fireEvent.click(overlays[0]);
        await waitFor(() => {
            expect(screen.getAllByTitle('タップで隠す')).toHaveLength(1);
            expect(screen.getAllByTitle('タップで表示')).toHaveLength(1);
        });
    });
});
