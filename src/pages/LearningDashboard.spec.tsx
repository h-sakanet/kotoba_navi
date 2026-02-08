import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LearningDashboard } from './LearningDashboard';
import type { Scope, Word } from '../types';
import type { LearningDailyStat } from '../services/learningLogService';

const {
    mockNavigate,
    state,
    setState
} = vi.hoisted(() => {
    const mockNavigate = vi.fn();
    const state: {
        scope: Scope | undefined;
        words: Word[];
        schedule: { id?: number; scopeId: string; date: string } | undefined;
        logs: LearningDailyStat[];
    } = {
        scope: {
        id: '42A-02',
        startPage: 12,
        endPage: 16,
        category: 'ことわざ'
        },
        words: [],
        schedule: undefined,
        logs: []
    };

    return {
        mockNavigate,
        state,
        setState: (next: Partial<typeof state>) => {
            Object.assign(state, next);
        }
    };
});

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ scopeId: '42A-02' })
    };
});

vi.mock('../data/scope', () => ({
    findScopeById: () => state.scope
}));

vi.mock('../db', () => ({
    db: {
        words: {
            where: () => ({
                between: () => ({
                    toArray: () => Promise.resolve(state.words)
                })
            })
        },
        schedules: {
            where: () => ({
                equals: () => ({
                    first: () => Promise.resolve(state.schedule)
                })
            })
        }
    }
}));

vi.mock('../services/learningLogService', async () => {
    const actual = await vi.importActual('../services/learningLogService');
    return {
        ...actual,
        learningLogService: {
            getRange: vi.fn(() => Promise.resolve(state.logs))
        }
    };
});

describe('LearningDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setState({
            scope: {
                id: '42A-02',
                startPage: 12,
                endPage: 16,
                category: 'ことわざ'
            },
            words: [],
            schedule: undefined,
            logs: []
        });
    });

    it('テスト日を yyyy/m/d 形式で表示し、全体グラフと語彙タイトルを描画する', async () => {
        setState({
            scope: {
            id: '42A-02',
            startPage: 12,
            endPage: 16,
            category: 'ことわざ'
            },
            words: [
            {
                id: 1,
                page: 12,
                numberInPage: 1,
                category: 'ことわざ',
                question: '意味',
                answer: 'ぬれ手であわ',
                rawWord: 'ぬれ手であわ',
                yomigana: 'ぬれてであわ',
                rawMeaning: '苦労せず利益を得る',
                isLearnedCategory: false,
                isLearnedMeaning: false
            }
            ],
            schedule: { scopeId: '42A-02', date: '2026-02-17' },
            logs: []
        });

        render(<LearningDashboard />);

        expect(await screen.findByText('学習グラフ（全体）')).toBeInTheDocument();
        expect(screen.getByText('テスト日: 2026/2/17')).toBeInTheDocument();
        expect(screen.getByText('ぬれ手であわ')).toBeInTheDocument();
    });

    it('片側カテゴリ（同音異義語）は右側ラベルのみ表示する', async () => {
        setState({
            scope: {
                id: '42A-02',
                startPage: 12,
                endPage: 16,
                category: '同音異義語'
            },
            words: [
            {
                id: 2,
                page: 12,
                numberInPage: 1,
                category: '同音異義語',
                question: '',
                answer: '',
                rawWord: '医院',
                rawMeaning: '',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '医院', yomigana: 'いいん' },
                    { rawWord: '委員', yomigana: 'いいん' }
                ]
            }
            ],
            schedule: { scopeId: '42A-02', date: '2026-02-17' },
            logs: []
        });

        render(<LearningDashboard />);

        await waitFor(() => {
            expect(screen.queryByText('よみがな')).not.toBeInTheDocument();
        });
        expect(screen.getAllByText('同音異義語').length).toBeGreaterThan(0);
        expect(screen.getByText('医院')).toBeInTheDocument();
        expect(screen.getByText('委員')).toBeInTheDocument();
    });

    it('scope が見つからない場合はエラーメッセージを表示する', () => {
        setState({
            scope: undefined,
            words: [],
            schedule: undefined,
            logs: []
        });

        render(<LearningDashboard />);
        expect(screen.getByText('Scope not found')).toBeInTheDocument();
    });

    it('左側のみ表示カテゴリ（上下で対となる熟語）は左パネルのみ描画される', async () => {
        setState({
            scope: {
                id: '42A-29',
                startPage: 101,
                endPage: 102,
                category: '上下で対となる熟語'
            },
            words: [
                {
                    id: 101,
                    page: 101,
                    numberInPage: 1,
                    category: '上下で対となる熟語',
                    question: '',
                    answer: '',
                    rawWord: '厚遇',
                    rawMeaning: '',
                    yomigana: 'こうぐう',
                    exampleSentence: '外国から届いた手紙に＿＿を書く。',
                    exampleSentenceYomigana: 'がいこくからとどいたてがみに___をかく。',
                    isLearnedCategory: false,
                    isLearnedMeaning: false
                }
            ],
            schedule: { scopeId: '42A-29', date: '2026-02-17' },
            logs: []
        });

        render(<LearningDashboard />);
        expect(await screen.findByText('学習グラフ（全体）')).toBeInTheDocument();
        expect(screen.getAllByText('熟語').length).toBeGreaterThan(0);
        expect(screen.queryByText('例文')).not.toBeInTheDocument();
    });

    it('単語がない場合は「データがありません」を表示する', async () => {
        setState({
            scope: {
                id: '42A-02',
                startPage: 12,
                endPage: 16,
                category: 'ことわざ'
            },
            words: [],
            schedule: { scopeId: '42A-02', date: '2026-02-17' },
            logs: []
        });

        render(<LearningDashboard />);
        expect(await screen.findByText('データがありません')).toBeInTheDocument();
    });

    it('スケジュール未設定時は当日をテスト日として表示する', async () => {
        setState({
            scope: {
                id: '42A-02',
                startPage: 12,
                endPage: 16,
                category: 'ことわざ'
            },
            words: [
                {
                    id: 1,
                    page: 12,
                    numberInPage: 1,
                    category: 'ことわざ',
                    question: '意味',
                    answer: 'ぬれ手であわ',
                    rawWord: 'ぬれ手であわ',
                    rawMeaning: '苦労せず利益を得る',
                    isLearnedCategory: false,
                    isLearnedMeaning: false
                }
            ],
            schedule: undefined,
            logs: []
        });

        render(<LearningDashboard />);
        expect(await screen.findByText(/^テスト日:/)).toBeInTheDocument();
    });

    it('戻るボタン押下でモーダル付きホームへ遷移する', async () => {
        setState({
            scope: {
                id: '42A-02',
                startPage: 12,
                endPage: 16,
                category: 'ことわざ'
            },
            words: [
                {
                    id: 1,
                    page: 12,
                    numberInPage: 1,
                    category: 'ことわざ',
                    question: '意味',
                    answer: 'ぬれ手であわ',
                    rawWord: 'ぬれ手であわ',
                    rawMeaning: '苦労せず利益を得る',
                    isLearnedCategory: false,
                    isLearnedMeaning: false
                }
            ],
            schedule: { scopeId: '42A-02', date: '2026-02-17' },
            logs: []
        });

        render(<LearningDashboard />);
        expect(await screen.findByText('学習グラフ（全体）')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button'));
        expect(mockNavigate).toHaveBeenCalledWith('/?modal=42A-02');
    });
});
