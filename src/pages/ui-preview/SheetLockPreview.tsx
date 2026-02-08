import React, { useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, PenOff, Shuffle, RotateCcw } from 'lucide-react';
import { WordListTableHeader } from '../../components/wordlist/WordListTableHeader';
import { WordListTableRow } from '../../components/wordlist/WordListTableRow';
import { CATEGORY_SETTINGS } from '../../utils/categoryConfig';
import { type Word } from '../../types';
import { type PanelSide } from '../../hooks/useMaskingState';

type Variant = 'a' | 'b' | 'c';
type CellState = 'opaque' | 'transparent' | 'locked';

type MockCell = {
    yomigana?: string;
    main: string;
    state: CellState;
};

type MockRow = {
    numberInPage: number;
    left: MockCell;
    right: MockCell;
    progress: {
        leftLocked: boolean;
        rightLocked: boolean;
        leftTestOk: boolean;
        rightTestOk: boolean;
    };
};

const PREVIEW_ROWS: MockRow[] = [
    {
        numberInPage: 1,
        left: { yomigana: 'ぬれてであわ', main: 'ぬれ手で粟', state: 'opaque' },
        right: { main: '苦労せず大きな利益を得ること。', state: 'transparent' },
        progress: { leftLocked: false, rightLocked: false, leftTestOk: true, rightTestOk: false }
    },
    {
        numberInPage: 2,
        left: { yomigana: 'いぬもあるけばぼうにあたる', main: '犬も歩けば棒にあたる', state: 'locked' },
        right: { main: '出歩いたり、行動したりすれば、思わぬことにぶつかるということ。', state: 'locked' },
        progress: { leftLocked: true, rightLocked: true, leftTestOk: true, rightTestOk: true }
    },
    {
        numberInPage: 3,
        left: { yomigana: 'いっすんのむしにもごぶのたましい', main: '一寸の虫にも五分の魂', state: 'transparent' },
        right: { main: '小さく弱い者にも意地はあるから、ばかにできないということ。', state: 'opaque' },
        progress: { leftLocked: false, rightLocked: false, leftTestOk: false, rightTestOk: true }
    }
];

const makeWord = (row: MockRow, idx: number): Word => ({
    id: idx + 1,
    page: 1,
    numberInPage: row.numberInPage,
    category: 'ことわざ',
    question: row.right.main,
    answer: row.left.main,
    rawWord: row.left.main,
    yomigana: row.left.yomigana,
    rawMeaning: row.right.main,
    isLearnedCategory: false,
    isLearnedMeaning: false
});

const variantLabel: Record<Variant, string> = {
    a: 'A案: 長押しロック（透過黄）',
    b: 'B案: 長押しロック（透過黄）',
    c: 'C案: 長押しロック（透過黄）'
};

const PreviewCell: React.FC<{ cell: MockCell }> = ({ cell }) => {
    const isHidden = cell.state === 'opaque';
    const isLocked = cell.state === 'locked';

    return (
        <div className="relative">
            <div className="relative rounded-lg overflow-hidden -m-2 p-2">
                <div className={clsx(
                    "rounded-lg min-h-[96px] p-3",
                    isHidden && "bg-[#2B7FFF]",
                    !isHidden && !isLocked && "bg-[#2B7FFF]/20",
                    !isHidden && isLocked && "bg-yellow-400/20 border border-yellow-400/30"
                )}>
                    {!isHidden && (
                        <div className="leading-relaxed mb-1 text-gray-800">
                            {cell.yomigana && (
                                <div className="text-xs text-gray-400 mb-0.5 font-bold">{cell.yomigana}</div>
                            )}
                            <div className={clsx(
                                "leading-relaxed mb-1 text-gray-800 text-lg",
                                cell.yomigana ? "font-bold" : "font-normal"
                            )}>
                                {cell.main}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const SheetLockPreview: React.FC<{ variant: Variant }> = ({ variant }) => {
    const [hideLeft] = useState(false);
    const [hideRight] = useState(true);
    const categoryConfig = CATEGORY_SETTINGS['ことわざ'];
    const words = PREVIEW_ROWS.map(makeWord);
    const isAnyMaskActive = hideLeft || hideRight;

    const renderPanelCell = (word: Word, _isEditing: boolean, side: PanelSide) => {
        const row = PREVIEW_ROWS.find(r => r.numberInPage === word.numberInPage);
        if (!row) return <td className="px-4 py-3 align-top h-1" />;
        const cell = side === 'left' ? row.left : row.right;

        return (
            <td className="px-4 py-3 align-top h-1">
                <div className="h-full flex flex-col">
                    <div className="mb-2 last:mb-0">
                        <PreviewCell cell={cell} />
                    </div>
                </div>
            </td>
        );
    };

    const Dot: React.FC<{ active: boolean }> = ({ active }) => (
        <span className={clsx(
            "w-3 h-3 rounded-full border block",
            active ? "bg-yellow-400 border-yellow-500" : "bg-transparent border-gray-300"
        )} />
    );

    const renderLearnCell = (word: Word) => {
        const row = PREVIEW_ROWS.find(r => r.numberInPage === word.numberInPage);
        const progress = row?.progress;
        if (!progress) return <td className="px-4 py-3 text-center align-top pt-4" />;
        return (
        <td className="px-4 py-3 text-center align-top pt-4">
            <div className="grid grid-cols-2 gap-1 justify-center w-fit mx-auto">
                <Dot active={progress.leftLocked} />
                <Dot active={progress.rightLocked} />
                <Dot active={progress.leftTestOk} />
                <Dot active={progress.rightTestOk} />
            </div>
        </td>
    );
    };

    const renderEditCell = () => (
        <td className="px-4 py-3 text-center align-top pt-3">
            <button
                type="button"
                disabled
                className={clsx(
                    "p-2 rounded-full transition-colors",
                    isAnyMaskActive ? "text-gray-300 cursor-not-allowed bg-gray-50" : "text-gray-400"
                )}
            >
                <PenOff size={16} />
            </button>
        </td>
    );

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-gray-300 px-4 py-3 flex items-center justify-between min-h-[60px]">
                <div className="flex items-center">
                    <button
                        type="button"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors mr-2"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-gray-900 leading-tight">シートロック UIプレビュー</h1>
                        <p className="text-xs text-gray-500">{variantLabel[variant]}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-blue-200 bg-blue-50 text-blue-700"
                        aria-label="シャッフル"
                    >
                        <Shuffle size={14} />
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-700"
                        aria-label="リセット"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden p-4 md:p-6 w-full max-w-4xl mx-auto flex flex-col">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto relative">
                        <table className="w-full text-left border-collapse">
                            <WordListTableHeader
                                categoryConfig={categoryConfig}
                                hasLeftMask
                                hasRightMask
                                hideLeft={hideLeft}
                                hideRight={hideRight}
                                onToggleLeft={() => { /* preview only */ }}
                                onToggleRight={() => { /* preview only */ }}
                            />
                            <tbody className="divide-y divide-gray-100">
                                {words.map((word) => (
                                    <WordListTableRow
                                        key={word.id}
                                        word={word}
                                        isEditing={false}
                                        leftGroups={categoryConfig.wordList.left}
                                        rightGroups={categoryConfig.wordList.right}
                                        renderPanelCell={renderPanelCell}
                                        renderLearnCell={(word) => renderLearnCell(word)}
                                        renderEditCell={renderEditCell}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};
