import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WordList } from './WordList';
import { BrowserRouter } from 'react-router-dom';

// --- Mocks ---
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ scopeId: 'TEST-01' }),
        useNavigate: () => vi.fn(),
    };
});

// Mock Data
const mockWords = [
    { id: 1, page: 1, numberInPage: 1, category: 'ことわざ', rawWord: 'MasteredWord', rawMeaning: 'Mean1', isLearnedCategory: true, isLearnedMeaning: true },
    { id: 2, page: 1, numberInPage: 2, category: 'ことわざ', rawWord: 'LearningWord', rawMeaning: 'Mean2', isLearnedCategory: true, isLearnedMeaning: false },
];

vi.mock('../db', () => ({
    db: {
        words: {
            where: () => ({
                between: () => ({
                    sortBy: () => Promise.resolve([...mockWords])
                })
            }),
            update: vi.fn(),
        }
    }
}));

vi.mock('../data/scope', () => ({
    SCOPES: [{ id: 'TEST-01', category: 'ことわざ', startPage: 1, endPage: 1 }]
}));

// --- Tests ---
describe('WordList Acceptance Test', () => {
    it('shows all words by default', async () => {
        render(
            <BrowserRouter>
                <WordList />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('MasteredWord')).toBeInTheDocument();
            expect(screen.getByText('LearningWord')).toBeInTheDocument();
        });
    });

    it('hides mastered words when toggle is turned ON', async () => {
        render(
            <BrowserRouter>
                <WordList />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('MasteredWord')).toBeInTheDocument());

        // Locate the toggle (assuming generic text for now, update implementation to match)
        // Proposal: A checkbox or switch labeled "習得済みを非表示"
        const toggle = screen.getByLabelText('習得済みを非表示');
        fireEvent.click(toggle);

        // Word 1 (Mastered) should disappear
        await waitFor(() => {
            expect(screen.queryByText('MasteredWord')).not.toBeInTheDocument();
        });

        // Word 2 (Not Mastered) should remain
        expect(screen.getByText('LearningWord')).toBeInTheDocument();
    });

    it('updates mastered status when dot is clicked in edit mode and saved', async () => {
        render(
            <BrowserRouter>
                <WordList />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('LearningWord')).toBeInTheDocument());

        // 1. Enter Edit Mode for "LearningWord"
        // Find the edit button for the second row (LearningWord)
        // Since we have multiple edit buttons, we need to be specific.
        // We can find the row by text, then find the button within it.
        const rows = screen.getAllByRole('row');
        // Row 0 is header. Row 1 is MasteredWord. Row 2 is LearningWord.
        const learningRow = rows[2];
        const editButton = await waitFor(() => learningRow.querySelector('button'));
        fireEvent.click(editButton!);

        // 2. Click the "Meaning" dot to toggle it to Mastered (since it was false)
        // In edit mode, dots are clickable.
        // We need to find the specific dot. The dot has a title "意味テスト習得".
        const meaningDot = screen.getAllByTitle('意味テスト習得')[1]; // 0 is for MasteredWord, 1 is for LearningWord
        fireEvent.click(meaningDot);

        // 3. Click Save
        const saveButton = learningRow.querySelector('button'); // The button icon changes to Save
        fireEvent.click(saveButton!);

        // 4. Verify db.words.update was called with correct values
        const { db } = await import('../db');
        await waitFor(() => {
            expect(db.words.update).toHaveBeenCalledWith(2, expect.objectContaining({
                isLearnedCategory: true, // Should remain true
                isLearnedMeaning: true   // Should become true
            }));
        });
    });
});
