import React from 'react';
import clsx from 'clsx';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { CATEGORY_SETTINGS } from '../../utils/categoryConfig';
import type { Category } from '../../types';

type Variant = 'a' | 'b' | 'c';

type DailyMetrics = {
    reveal: number;
    correct: number;
    wrong: number;
    forgot: number;
};

type WordActivity = {
    id: string;
    title: string;
    left?: DailyMetrics[];
    right?: DailyMetrics[];
};

type PreviewScenario = {
    category: Category;
    testDate: string;
    subtitle: string;
    words: WordActivity[];
};

const WINDOW_DAYS = 16;

const buildSeries = (
    reveal: number[],
    correct: number[],
    wrong: number[],
    forgot?: number[]
): DailyMetrics[] => {
    const normalize = (series: number[]): number[] => {
        if (series.length === WINDOW_DAYS) return series;
        if (series.length > WINDOW_DAYS) return series.slice(series.length - WINDOW_DAYS);
        return [...Array.from({ length: WINDOW_DAYS - series.length }, () => 0), ...series];
    };

    const normalizedReveal = normalize(reveal);
    const normalizedCorrect = normalize(correct);
    const normalizedWrong = normalize(wrong);
    const normalizedForgot = normalize(forgot ?? wrong.map((value) => (value >= 2 ? 1 : 0)));

    return normalizedReveal.map((value, index) => ({
        reveal: value,
        correct: normalizedCorrect[index],
        wrong: normalizedWrong[index],
        forgot: normalizedForgot[index]
    }));
};

const scenarioByVariant: Record<Variant, PreviewScenario> = {
    a: {
        category: 'ことわざ',
        testDate: '2026-02-17',
        subtitle: 'A案: 左右分割ヒートマップ（テスト前2週間）',
        words: [
            {
                id: 'w1',
                title: 'ぬれ手であわ',
                left: buildSeries(
                    [4, 3, 4, 5, 4, 3, 5, 4, 2, 3, 4, 5, 3, 2],
                    [1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 2, 2, 2],
                    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0]
                ),
                right: buildSeries(
                    [3, 2, 3, 4, 3, 3, 4, 3, 2, 3, 3, 4, 2, 2],
                    [0, 1, 1, 1, 2, 1, 2, 2, 1, 1, 2, 2, 2, 2],
                    [2, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 0, 0]
                )
            },
            {
                id: 'w2',
                title: '犬も歩けば棒に当たる',
                left: buildSeries(
                    [2, 3, 2, 3, 3, 2, 4, 3, 2, 2, 3, 3, 2, 2],
                    [1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 1],
                    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0]
                ),
                right: buildSeries(
                    [2, 2, 2, 3, 2, 2, 3, 2, 1, 2, 2, 3, 2, 1],
                    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0]
                )
            },
            {
                id: 'w3',
                title: '一寸の虫にも五分の魂',
                left: buildSeries(
                    [2, 2, 3, 2, 2, 2, 3, 3, 2, 2, 2, 3, 2, 2],
                    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 0]
                ),
                right: buildSeries(
                    [2, 3, 3, 3, 2, 3, 4, 3, 2, 2, 3, 3, 2, 2],
                    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [2, 2, 2, 2, 2, 1, 2, 1, 1, 1, 1, 1, 0, 0]
                )
            }
        ]
    },
    b: {
        category: '同音異義語',
        testDate: '2026-02-17',
        subtitle: 'B案: 片側カテゴリ確認（右のみ有効）',
        words: [
            {
                id: 'w1',
                title: '医院',
                right: buildSeries(
                    [3, 2, 3, 4, 3, 3, 4, 4, 3, 3, 4, 4, 3, 2],
                    [1, 1, 1, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2],
                    [2, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 0, 0]
                )
            },
            {
                id: 'w2',
                title: '異例',
                right: buildSeries(
                    [2, 2, 3, 3, 3, 2, 3, 3, 2, 2, 3, 3, 2, 2],
                    [1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1, 1],
                    [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 0]
                )
            }
        ]
    },
    c: {
        category: '類義語',
        testDate: '2026-02-17',
        subtitle: 'C案: 左右ペア語彙（タイトル: 左/右）',
        words: [
            {
                id: 'w1',
                title: '不足 / 欠乏',
                left: buildSeries(
                    [2, 2, 3, 3, 2, 2, 3, 3, 2, 2, 3, 3, 2, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0]
                ),
                right: buildSeries(
                    [2, 2, 2, 3, 2, 2, 3, 2, 2, 2, 3, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 0]
                )
            },
            {
                id: 'w2',
                title: '確信 / 信念',
                left: buildSeries(
                    [2, 2, 2, 3, 2, 2, 3, 2, 2, 2, 3, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0]
                ),
                right: buildSeries(
                    [1, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0]
                )
            }
        ]
    }
};

const metricRows = [
    { key: 'reveal' as const, label: 'シート学習' },
    { key: 'wrong' as const, label: 'テスト不正解' },
    { key: 'correct' as const, label: 'テスト正解' },
    { key: 'forgot' as const, label: 'テスト忘却' }
];

const getDateWindow = (testDate: string) => {
    const date = new Date(`${testDate}T00:00:00`);
    const labels: string[] = [];
    for (let offset = WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
        const d = new Date(date);
        d.setDate(date.getDate() - offset);
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }

    const start = new Date(date);
    start.setDate(date.getDate() - (WINDOW_DAYS - 1));
    const end = new Date(date);

    const format = (d: Date) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    return { labels, rangeLabel: `${format(start)} 〜 ${format(end)}` };
};

const sumSeries = (words: WordActivity[], side: 'left' | 'right'): DailyMetrics[] | undefined => {
    const sideSeries = words.map(word => word[side]).filter((series): series is DailyMetrics[] => !!series);
    if (sideSeries.length === 0) return undefined;

    return Array.from({ length: WINDOW_DAYS }).map((_, index) => ({
        reveal: sideSeries.reduce((acc, series) => acc + series[index].reveal, 0),
        correct: sideSeries.reduce((acc, series) => acc + series[index].correct, 0),
        wrong: sideSeries.reduce((acc, series) => acc + series[index].wrong, 0),
        forgot: sideSeries.reduce((acc, series) => acc + series[index].forgot, 0)
    }));
};

const getTone = (
    value: number,
    maxValue: number,
    type: 'reveal' | 'correct' | 'wrong' | 'forgot',
    monochromeBlue: boolean = false
): string => {
    if (value <= 0 || maxValue <= 0) return 'bg-gray-100 text-gray-400';
    const ratio = value / maxValue;

    if (monochromeBlue) {
        if (type === 'forgot') {
            if (ratio < 0.2) return 'bg-red-50 text-red-600';
            if (ratio < 0.45) return 'bg-red-100 text-red-700';
            if (ratio < 0.75) return 'bg-red-300 text-red-900';
            return 'bg-red-500 text-white';
        }
        if (ratio < 0.2) return 'bg-[#DBEAFE] text-[#1E3A8A]';
        if (ratio < 0.45) return 'bg-[#93C5FD] text-[#1E3A8A]';
        if (ratio < 0.75) return 'bg-[#3B82F6] text-white';
        return 'bg-[#1D4ED8] text-white';
    }

    if (type === 'reveal') {
        if (ratio < 0.34) return 'bg-blue-50 text-blue-600';
        if (ratio < 0.67) return 'bg-blue-100 text-blue-700';
        return 'bg-blue-200 text-blue-800';
    }

    if (type === 'correct') {
        if (ratio < 0.34) return 'bg-yellow-50 text-yellow-700';
        if (ratio < 0.67) return 'bg-yellow-100 text-yellow-800';
        return 'bg-yellow-200 text-yellow-900';
    }

    if (ratio < 0.34) return 'bg-red-50 text-red-600';
    if (ratio < 0.67) return 'bg-red-100 text-red-700';
    return 'bg-red-200 text-red-800';
};

const HeatmapGrid: React.FC<{
    panelLabel: string;
    dates: string[];
    series?: DailyMetrics[];
    simplified?: boolean;
}> = ({ panelLabel, dates, series, simplified = false }) => {
    const maxReveal = Math.max(...(series?.map(item => item.reveal) ?? [0]));
    const maxCorrect = Math.max(...(series?.map(item => item.correct) ?? [0]));
    const maxWrong = Math.max(...(series?.map(item => item.wrong) ?? [0]));
    const maxForgot = Math.max(...(series?.map(item => item.forgot) ?? [0]));

    return (
        <div className={clsx(
            simplified ? 'p-0' : 'rounded-xl border border-gray-200 bg-white p-3',
            simplified && 'w-fit mx-auto'
        )}>
            <p className="text-xs font-semibold text-gray-600 mb-2">{panelLabel}</p>
            {series ? (
                <div className={clsx(!simplified && 'overflow-x-auto')}>
                    <table className={clsx(
                        'border-collapse',
                        simplified ? 'mx-auto' : 'min-w-[680px] w-full'
                    )}>
                        <thead>
                            <tr>
                                <th className={clsx(simplified ? 'w-16' : 'w-24')} />
                                {dates.map(date => (
                                    <th key={date} className={clsx(
                                        'text-[10px] font-medium text-gray-500 text-center',
                                        simplified ? 'w-6 pb-1 px-0' : 'pb-1 px-0.5'
                                    )}>{date}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {metricRows.map(metric => (
                                <tr key={metric.key}>
                                    <td className={clsx(
                                        'text-[11px] text-gray-600 whitespace-nowrap',
                                        simplified ? 'pr-1 py-0.5' : 'pr-2 py-1.5'
                                    )}>{metric.label}</td>
                                    {series.map((item, index) => {
                                        const value = item[metric.key];
                                        const max = metric.key === 'reveal'
                                            ? maxReveal
                                            : metric.key === 'correct'
                                                ? maxCorrect
                                                : metric.key === 'wrong'
                                                    ? maxWrong
                                                    : maxForgot;
                                        return (
                                            <td key={`${metric.key}-${index}`} className={clsx(
                                                simplified ? 'w-6 p-[1px] text-center' : 'px-0.5 py-1.5'
                                            )}>
                                                <div
                                                    className={clsx(
                                                        'font-semibold flex items-center justify-center',
                                                        simplified ? 'w-6 h-6 rounded-[3px] text-[10px]' : 'w-9 h-7 rounded-md border text-[11px]',
                                                        getTone(value, max, metric.key, simplified)
                                                    )}
                                                >
                                                    {value}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={clsx(
                    'border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-400',
                    simplified ? 'min-h-[96px]' : 'rounded-lg min-h-[118px]'
                )}>
                    対象データなし
                </div>
            )}
        </div>
    );
};

const renderWordCards = (
    words: WordActivity[],
    dates: string[],
    leftLabel: string,
    rightLabel: string,
    showLeft: boolean,
    showRight: boolean,
    simplified: boolean = false
) => (
    <div className="space-y-3">
        {words.map(word => (
            <section key={word.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className={clsx(
                    'text-base font-bold text-gray-900',
                    simplified ? 'mb-1' : 'mb-3'
                )}>{word.title}</h3>
                {showLeft && showRight ? (
                    <div className={clsx('grid grid-cols-2', simplified ? 'gap-6' : 'gap-3')}>
                        <HeatmapGrid panelLabel={leftLabel} dates={dates} series={word.left} simplified={simplified} />
                        <HeatmapGrid panelLabel={rightLabel} dates={dates} series={word.right} simplified={simplified} />
                    </div>
                ) : showLeft ? (
                    <HeatmapGrid panelLabel={leftLabel} dates={dates} series={word.left} simplified={simplified} />
                ) : (
                    <HeatmapGrid panelLabel={rightLabel} dates={dates} series={word.right} simplified={simplified} />
                )}
            </section>
        ))}
    </div>
);

export const LearningDashboardPreview: React.FC<{ variant: Variant }> = ({ variant }) => {
    const scenario = scenarioByVariant[variant];
    const labels = CATEGORY_SETTINGS[scenario.category].wordList.headerLabels;
    const { labels: dateLabels, rangeLabel } = getDateWindow(scenario.testDate);
    const totalLeft = sumSeries(scenario.words, 'left');
    const totalRight = sumSeries(scenario.words, 'right');
    const isRefinedA = variant === 'a';
    const showLeft = !!totalLeft;
    const showRight = !!totalRight;

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-gray-300 px-4 py-3 flex items-center justify-between min-h-[60px]">
                <div className="flex items-center">
                    <button type="button" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors mr-2">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-gray-900 leading-tight">学習ダッシュボード UIプレビュー</h1>
                        <p className="text-xs text-gray-500">{scenario.subtitle}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={14} />テスト日: {scenario.testDate}</span>
                    <span>集計範囲: {rangeLabel}</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-6xl mx-auto flex flex-col gap-4">
                <section className="rounded-2xl border border-gray-200 bg-white p-4">
                    <h2 className="text-base font-bold text-gray-900 mb-1">学習グラフ（全体）</h2>
                    {!isRefinedA && (
                        <p className="text-xs text-gray-500 mb-3">
                            横軸: 日付 / 縦軸: シート透過・テスト正解・テスト間違い（セル内は回数）
                        </p>
                    )}
                    {showLeft && showRight ? (
                        <div className={clsx('grid grid-cols-2', isRefinedA ? 'gap-6' : 'gap-3')}>
                            <HeatmapGrid panelLabel={labels.left} dates={dateLabels} series={totalLeft} simplified={isRefinedA} />
                            <HeatmapGrid panelLabel={labels.right} dates={dateLabels} series={totalRight} simplified={isRefinedA} />
                        </div>
                    ) : showLeft ? (
                        <HeatmapGrid panelLabel={labels.left} dates={dateLabels} series={totalLeft} simplified={isRefinedA} />
                    ) : (
                        <HeatmapGrid panelLabel={labels.right} dates={dateLabels} series={totalRight} simplified={isRefinedA} />
                    )}
                    {!isRefinedA && (
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-700">
                            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-blue-200 inline-block" />シート透過</span>
                            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-yellow-200 inline-block" />テスト正解</span>
                            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-red-200 inline-block" />テスト間違い（やり直し系）</span>
                        </div>
                    )}
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-bold text-gray-900">言葉ごとの学習グラフ</h2>
                    {renderWordCards(scenario.words, dateLabels, labels.left, labels.right, showLeft, showRight, isRefinedA)}
                </section>
            </main>
        </div>
    );
};

export type { Variant as LearningDashboardVariant };
